import { createClient } from "@supabase/supabase-js";
import { decrypt, encrypt } from "./cryptoService";
import { supabase } from "../db/supabaseClient";
import { UserTokens } from "../models/userTokens.models";
import { randomUUID } from "crypto";
import { User } from "shared-types";
import { refreshAccessToken } from "./googleAuthService";
import { UserService } from "./user.service";


export class UserTokenService {
    async saveSessionId(userId: string, sessionId: string) {
        const { error } = await supabase
            .from('user_token')
            .update({ active_session_id: sessionId })
            .eq('user_id', userId);
        if (error) {
            console.error('Error saving session ID:', error);
            throw new Error('Failed to save session ID');
        }
    }

    async saveTokens(userId: string, refreshToken: string, access_token: string, sessionId?: string): Promise<string> {
        // Encrypt the refresh token before saving
        const cryptRefreshToken = encrypt(refreshToken);
        const cryptAccessToken = encrypt(access_token);
        const activeSessionId = sessionId || randomUUID();
        const checkUser = await this.findByUserId(userId);
        if (checkUser != null) {
            // If user token already exists, update it
            try {
                await this.updateTokensWithSession(userId, cryptAccessToken, activeSessionId);
                return activeSessionId;
            } catch (error) {
                console.error('Error updating user tokens:', error);
            }
        }
        else {
            const user_token: UserTokens = new UserTokens(
                randomUUID(), userId, cryptAccessToken, new Date(Date.now() + 60 * 60 * 1000).toISOString(), cryptRefreshToken,
                new Date().toISOString(), new Date().toISOString(),
                activeSessionId, new Date().toISOString(), new Date().toISOString()
            );
            console.log(`going to add new row to user_token table`);
            const { data, error } = await supabase
                .from('user_token')
                .insert([
                    user_token.toDatabaseFormat()
                ]);

            if (error) {
                console.error('❌ Error inserting into user_token:', error);
            } else {
                console.log('✅ Inserted into user_token:', data);
            }
        }
        return activeSessionId;
    }
    async updateTokens(userId: string, cryptAccessToken: string): Promise<void> {
        const { error } = await supabase
            .from('user_token')
            .update({
                access_token: cryptAccessToken,
                access_token_expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        if (error) {
            console.error('Error updating user tokens:', error);
            throw new Error('Failed to update user tokens');
        }
    }
    async updateTokensWithSession(userId: string, cryptAccessToken: string, activeSessionId: string): Promise<void> {

        const { error } = await supabase
            .from('user_token')
            .update({
                access_token: cryptAccessToken,
                access_token_expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                active_session_id: activeSessionId,
                // sessionCreatedAt: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        if (error) {
            console.error('Error updating user tokens:', error);
            throw new Error('Failed to update user tokens');
        }
    }
    async findByUserId(userId: string): Promise<UserTokens | null> {
        // Mocked return for demonstration
        // Fetch the user token record from the database
        // Uncomment the following lines to use the actual database query
        try {
            const { data, error } = await supabase
                .from('user_token')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error || !data) {
                console.error('Error fetching user tokens:', error);
                return null;
            }
            return {
                userId: data.user_id, accessToken: decrypt(data.access_token), accessTokenExpiry: data.access_token_expiry,
                refreshToken: decrypt(data.refresh_token), activeSessionId: data.active_session_id,
                createdAt: data.created_at, updatedAt: data.updated_at
            } as UserTokens
        } catch (error) {
            console.log(error);
        }
        return null;

    }


    async validateSession(userId: string, sessionId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('user_token')
            .select('active_session_id')
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            console.error('Error validating session:', error);
            return false;
        }
        return data.active_session_id === sessionId;
    }
    async invalidateSession(userId: string): Promise<void> {
        const { error } = await supabase
            .from('user_token')
            .update({
                active_session_id: null,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        if (error) {
            console.error('Error invalidating session:', error);
            throw new Error('Failed to invalidate session');
        }
    }
    async checkIfExpiredAccessToken(userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('user_token')
            .select('access_token_expiry')
            .eq('user_id', userId)
            .single();
        if (error) {
            console.error('Error fetching user tokens:', error);
            return false;
        }
        if (!data || !data.access_token_expiry) {
            console.warn('accessTokenExpiry is missing');
            return true; // If there is no value, consider it expired
        }
        const now = new Date();
        const expiryDate = new Date(data.access_token_expiry);
        return now >= expiryDate;
    }
    async getSystemAccessToken(): Promise<string | null> {
        try {
            const systemEmail = process.env.SYSTEM_EMAIL || '';
            const userService = new UserService();
            const system = await userService.getUserByEmail(systemEmail);
            if (system) {
                const systemAccessToken = await this.getAccessTokenByUserId(system.id || system.googleId);
                return systemAccessToken;
            }
        } catch (error) {
            console.error('Error fetching system access token:', error);
            return null;
        }
        return null;
    }
    async getAccessTokenByUserId(userId: string): Promise<string | null> {
        if (await this.checkIfExpiredAccessToken(userId)) {
            //if access token is expired, we need to refresh it
            const refreshToken = await this.getRefreshTokenByUserId(userId)
            const data = await refreshAccessToken(refreshToken)
            this.updateTokens(userId, encrypt(data.access_token));
            return data.access_token;
        }
        const { data, error } = await supabase
            .from('user_token')
            .select('access_token')
            .eq('user_id', userId)
            .single();
        if (error) {
            console.error('Error fetching user tokens:', error);
            return null;
        }
        return decrypt(data.access_token);
    }
    async getRefreshTokenByUserId(userId: string): Promise<string> {
        const { data, error } = await supabase
            .from('user_token')
            .select('refresh_token')
            .eq('user_id', userId)
            .single();
        if (error || !data) {
            console.error('Error fetching user tokens:', error);
        }
        return decrypt(data?.refresh_token);
    }
    async getCurrentSessionId(userId: string): Promise<string | null> {
        try {
            const { data, error } = await supabase
                .from('user_token')
                .select('active_session_id')
                .eq('user_id', userId)
                .single();
            if (error || !data) {
                console.log('Error while get active_session_id ', error || 'not data');
                return null;
            }
            return data.active_session_id
        } catch (error) {
            console.log('Error while get active_session_id ', error || 'not data');
            return null;
        }

    }
    async deleteUserSession(userId: string, sessionId: string): Promise<void> {
        const { error } = await supabase
            .from('user_token')
            .delete()
            .eq('user_id', userId)
            .eq('active_session_id', sessionId);
        if (error) {
            console.error('Error deleting user session:', error);
            throw new Error('Failed to delete user session');
        }
    }
}