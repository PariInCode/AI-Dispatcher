import axios from "axios";

export default axios.create({ baseURL:"https://raasta-server.onrender.com/api", timeout: 90000 });