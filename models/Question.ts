import { firestore } from "firebase";

export interface Question {
  id: string;
  senderUid: string;
  receiverUid: string;
  body: string;
  isReplied: boolean;
  createdAt: firestore.Timestamp;
}
