import express, { Request, Response, NextFunction } from "express"
import "dotenv/config"
import {
  allTechUsers,
  archi,
  devOps,
  getDateLeave,
  getGlobalMessage,
  getLeavesBySquad,
  getLeavesByUserId,
  getSquadAbsenceData,
  squadAcc,
  squadCom,
  squadDoc,
  teamQA,
} from "./constants/api.js"

const app = express()
const PORT = process.env.PORT || 3002

app.get("/", (req, res, next) => {
  try {
    return res.send({ message: "hello " })
  } catch (error) {
    return next(error)
  }
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "development") {
    console.error(err)
  }
  res.status(500).send({
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
})

// getLeavesByUserId(57);
// allTechUsers();
// getSquad(teamQA);
// getLeavesBySquad(squadAcc);
// dateLeave();
getGlobalMessage()
// getSquadAbsenceData(teamQA);

app.listen(PORT, () => {})
