import { Request, Response } from 'express';
import { RoomService } from '../services/room.service';
import { RoomModel } from "../models/room.model";

export class RoomController {
  private roomService = new RoomService();

  async createRoom(req: Request, res: Response) {
    console.log('Received request to create room:', req.body);
    try {
      const body = req.body;

      // תמיכה גם ב-snake_case וגם ב-camelCase
      const workspaceMapId = body.workspaceMapId || body.workspace_map_id;
      if (!workspaceMapId) {
        return res.status(400).json({ error: 'workspaceMapId is required' });
      }

      // המרת ציוד ומאפיינים למערכים
      const equipment = Array.isArray(body.equipment)
        ? body.equipment
        : typeof body.equipment === 'string'
          ? body.equipment.split(',').map((e: string) => e.trim()).filter(Boolean)
          : [];

      const features = Array.isArray(body.features)
        ? body.features
        : typeof body.features === 'string'
          ? body.features.split(',').map((f: string) => f.trim()).filter(Boolean)
          : [];

      // יצירת אובייקט חדר עם mapping נכון
      const roomData = {
        id: body.id,
        name: body.name,
        description: body.description || '',
        type: body.type,
        status: body.status,
        capacity: body.capacity ?? 1,

        hourlyRate: body.hourlyRate ?? body.hourly_rate ?? 0,
        discountedHourlyRate: body.discountedHourlyRate ?? body.discounted_hourly_rate ?? 0,

        location: body.location ?? '',

        MinimumBookingMinutes: body.MinimumBookingMinutes ?? body.minimum_booking_minutes ?? 30,
        MaximumBookingMinutes: body.MaximumBookingMinutes ?? body.maximum_booking_minutes ?? 120,
        RequiredApproval: 
          body.RequiredApproval === true || 
          body.RequiredApproval === 'true' || 
          body.required_approval === true || 
          body.required_approval === 'true',

        workspaceMapId,
        equipment,
        features,
        FreeHoursForKlikcaCard: body.FreeHoursForKlikcaCard ?? body.free_hours_for_klikca_card ?? 0,

        positionX: body.positionX ?? body.position_x ?? 0,
        positionY: body.positionY ?? body.position_y ?? 0,
        width: body.width ?? body.width ?? 1,
        height: body.height ?? body.height ?? 1,

        createdAt: body.createdAt ?? body.createdat,
        updatedAt: body.updatedAt ?? body.updatedat
      };

      const room = new RoomModel(roomData);
      console.log('Room object created:', JSON.stringify(room, null, 2));

      const result = await this.roomService.createRoomRequest(room);

      if (result) {
        res.status(200).json(result);
      } else {
        res.status(500).json({ error: "Failed to create room" });
      }
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getRooms(req: Request, res: Response) {
    try {
      const result = await this.roomService.getAllrooms();
      if (result) {
        res.status(200).json(result);
      } else {
        res.status(500).json({ error: "Failed to fetch rooms" });
      }
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateRoom(req: Request, res: Response) {
    try {
      const body = req.body;
      const mappedRoomData = {
        ...body,
        hourlyRate: body.hourlyRate ?? body.hourly_rate ?? 0,
        discountedHourlyRate: body.discountedHourlyRate ?? body.discounted_hourly_rate ?? 0,
        RequiredApproval:
          body.RequiredApproval === true || 
          body.RequiredApproval === 'true' || 
          body.required_approval === true || 
          body.required_approval === 'true'
      };

      const room = new RoomModel(mappedRoomData);
      const updateRoom = await this.roomService.updateRoom(req.params.id, room);
      res.json(updateRoom);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async getRoomById(req: Request, res: Response) {
    try {
      const getRoom = await this.roomService.getRoomById(req.params.id);
      res.json(getRoom);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  async deleteRoom(req: Request, res: Response) {
    try {
      const deleteRoom = await this.roomService.deleteRoom(req.params.id);
      res.json(deleteRoom);
    } catch (err) {
      res.status(500).json({ message: 'Error deleting room' });
    }
  }
}
