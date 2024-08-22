import axios from 'axios'
import 'dotenv/config'

const API_KEY = process.env.REACT_APP_API_KEY;
const instance = axios.create({
    baseURL: 'https://lelivrescolaire.ilucca.net'

});
    
instance.defaults.headers.common['Authorization'] = `lucca application=${API_KEY}`;
instance.defaults.headers.common['Content-Type'] = 'application/json';

export default instance;

            


