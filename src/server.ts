import express, { Request, Response, NextFunction } from "express"
import "dotenv/config"
import { hello } from "@/constants/message.js"
import { allTechUsers, archi, devOps, getLeavesBySquad, getSquad, presenceForAllUsers, squadAcc, squadCom, squadDoc} from "./constants/api.js"

const app = express()
const PORT = process.env.PORT || 3002

app.get("/", (req, res, next) => {
  try {
    return res.send({ message: hello })
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




// allTechUsers();
// getSquad();
// presenceForAllUsers();
getLeavesBySquad(squadAcc);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
})
