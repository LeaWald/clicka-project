import axios from 'axios';

const server = process.env.REACT_APP_API_URL;
//חיבור לשרת הAPI של המשתמשים
export const axiosInstance = axios.create({
    baseURL: server,
    headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Enable sending cookies with requests
    });
    
    export default axiosInstance;