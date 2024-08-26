import "dotenv/config"
import axios from 'axios';
import { getGlobalMessage } from "./api.js";

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export const sendMessageToSlack = async () => {
    const messageArray = await getGlobalMessage();
    const message = messageArray.join(' \n ');
    try {
      if (!SLACK_WEBHOOK_URL) {
        throw new Error("The webhook slack is missing in the environements variables");
      }
  
      const response = await axios.post(SLACK_WEBHOOK_URL, {
        text: message, 
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      console.log("Message sent :", response.data)
    } catch (error) {
      console.error("Error sending message to Slack:", error)
    }
  };

  