import { useForm } from "react-hook-form"
import { Form } from "../../../../Common/Components/BaseComponents/Form"
import { InputField } from "../../../../Common/Components/BaseComponents/Input"
import { Button } from "../../../../Common/Components/BaseComponents/Button"
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod"
import { useAuthStore } from "../../../../Stores/CoreAndIntegration/useAuthStore";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { showAlert } from "../../../../Common/Components/BaseComponents/ShowAlert";
import axiosInstance from "../../../../Service/Axios";
const schema = z.object({
    email: z.string().min(1, "Email required").email("Invalid Email").nonempty("EMAIL"),
    password: z.string().min(1, "Password required").nonempty("PASSWORD"),
});

type FormSchema = z.infer<typeof schema>;
export const LoginWithPassword = () => {
    const { setUser, setSessionId } = useAuthStore();
    const navigate = useNavigate();

    const methods = useForm<FormSchema>({
        resolver: zodResolver(schema),
    });
    const onSubmit = async (data: FormSchema) => {
        try {

            const response = await axiosInstance.post("/auth/loginWithPassword", JSON.stringify(data, null, 2));
            console.log(" success", response.data);
            setUser(response.data.user);
            setSessionId(response.data.sessionId);
            navigate("/");
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.data.error === 'Invalid email or password') {
                console.error("Invalid password", error.response?.data);
                showAlert("Invalid email or password", "מייל או סיסמא לא נכונים", "error");
            } else {
                console.error("error logging in", error);
            }

        }
    };
  
    return (
<Form
            schema={schema}
            methods={methods}
            onSubmit={onSubmit}
            className="!flex !flex-col !items-center gap-5 w-full max-w-sm mx-auto">
            <InputField name="email" label="מייל" type="email" required placeholder="email"  
            className="w-full text-lg py-3 px-4 border rounded-lg"/>
            <br />
            <InputField name="password" label="סיסמה" type="password" required placeholder="password" 
             className="w-full text-lg py-3 px-4 border rounded-lg"/>
            <br />
            <Button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 text-lg rounded-lg hover:bg-blue-700 transition-colors">
                התחבר
            </Button>
        </Form>
    )

}