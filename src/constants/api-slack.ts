import "dotenv/config"
import axios from "axios"
import { getGlobalMessage, getLeavesBySquad, squadCom } from "./api.js"

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

const messageGlobalArr= await getGlobalMessage()
export const messageGlobal = messageGlobalArr.join(" \n ")

const messageBySquadArr = await getLeavesBySquad(squadCom)
export const messageBySquad = messageBySquadArr.join(" \n ")

export const sendMessageToSlack = async (message: string) => {
  try {
    if (!SLACK_WEBHOOK_URL) {
      throw new Error(
        "The webhook slack is missing in the environements variables"
      )
    }

    const response = await axios.post(
      SLACK_WEBHOOK_URL,
      {
        text: message,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    console.log("Message sent :", response.data)
  } catch (error) {
    console.error("Error sending message to Slack:", error)
  }
}
