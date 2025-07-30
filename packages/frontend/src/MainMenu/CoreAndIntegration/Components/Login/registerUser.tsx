import axios from "axios";
import { Form } from "../../../../Common/Components/BaseComponents/Form"
import z from "zod"
import { InputField } from "../../../../Common/Components/BaseComponents/Input";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import axiosInstance from "../../../../Service/Axios";
import { useAuthStore } from "../../../../Stores/CoreAndIntegration/useAuthStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../../../Common/Components/BaseComponents/Button"
import {  useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRole } from "shared-types";
import { Eye, EyeOff } from "lucide-react";


export const RegisterUser = () => {
    const [showPassword, setShowPassword] = useState(false);
    const { user } = useAuthStore();
    const schema = z.object({
        email: z.string().min(1, "Email required").email("Invalid Email").nonempty("EMAIL"),
        password: z.string().min(1, "Password required").nonempty("PASSWORD"),
    });
    type FormSchema = z.infer<typeof schema>;

    const methods = useForm<FormSchema>({
        resolver: zodResolver(schema),
    });
    const navigate = useNavigate();

    const register = async (data: FormSchema) => {
        if (!user || !user.email) {
            showAlert("לא ניתן להירשם עם סיסמה", "נא התחבר קודם עם גוגל", "error");
            // window.location.href = "/"; 
            navigate("/");
            return;
        }
        try {
            if (user.email !== data.email && user.role !== UserRole.ADMIN) {
                showAlert("Email mismatch", "מייל לא תואם למשתמש המחובר", "error");
                return;
            }
            const response = await axiosInstance.post("/auth/registerUserPassword", JSON.stringify(data, null, 2));
            console.log("Registration successful", response.data);
            navigate("/");
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data.error === 'User password already exists') {
                showAlert("User password already exists", "קיימת סיסמה למשתמש", "error");
                return;
            }
            else if (axios.isAxiosError(error) && error.response?.data.error === 'User not exists') {
                showAlert("User not exists", "משתמש לא קיים", "error");
                return;
            }
            console.error("error logging in", error);
            showAlert("error", "Error registering user", "error");
        }
    }
    return (
        <Form
            schema={schema}
            methods={methods}
            onSubmit={register}
            className="mx-auto mt-10">
            <InputField name="email" label="מייל" type="email" required placeholder="email" />
            <br />
            <div className="relative">
                <InputField name="password" label="סיסמה" type={showPassword ? "text" : "password"} required placeholder="password" />
                <button
                    type="button"
                    className="absolute left-2 top-9"
                    onClick={() => setShowPassword(prev => !prev)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <br />
            <Button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={() => register(methods.getValues() as FormSchema)}>
                הרשם
            </Button>
        </Form>
    )
}
