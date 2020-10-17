import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { firestore } from 'firebase'
import Layout from '../../components/Layout'
import { Question } from '../../models/Question'
import { useAuthentication } from '../../hooks/authentication'
import { Answer } from '../../models/Answer'

type Query = {
  id: string
}

const QuestionsShow = () => {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [answer, setAnswer] = useState<Answer>(null);
  const query = router.query as Query;
  const { user } = useAuthentication();
  const [question, setQuestion] = useState<Question>(null);

  const loadData = () => {
    if (query.id === undefined) return
    
    void (async (): Promise<void> => {
      let questionDoc
      try {
        questionDoc = await firestore()
          .collection('questions')
          .doc(query.id)
          .get()
      } catch (err) {
        return;
      }

      if (!questionDoc.exists) return
      
      const gotQuestion = questionDoc.data() as Question
      gotQuestion.id = questionDoc.id
      setQuestion(gotQuestion);

      if (!gotQuestion.isReplied) {
        return
      }

      const answerSnapshot = await firestore()
        .collection('answers')
        .where('questionId', '==', gotQuestion.id)
        .limit(1)
        .get()
      if (answerSnapshot.empty) {
        return
      }

      const gotAnswer = answerSnapshot.docs[0].data() as Answer
      gotAnswer.id = answerSnapshot.docs[0].id
      setAnswer(gotAnswer)
    })();
    
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSending(true)

    await firestore().runTransaction(async (t) => {
      t.set(firestore().collection('answers').doc(), {
        uid: user.uid,
        questionId: question.id,
        body,
        createdAt: firestore.FieldValue.serverTimestamp(),
      })
      t.update(firestore().collection('questions').doc(question.id), {
        isReplied: true,
      })
    })

    const now = new Date().getTime();
    setAnswer({
      id: '',
      uid: user.uid,
      questionId: question.id,
      body,
      createdAt: new firestore.Timestamp(now / 1000, now % 1000),
    });
  }

  useEffect(() => {
    if (user === null) {
      return
    }

    loadData()
  }, [query.id, user])

  return (
    <Layout>
      <div className="row justify-content-center">
        <div className="col-12 col-md-6">
          {question && (
            <div className="card">
              <div className="card-body">{question.body}</div>
            </div>
          )}
        </div>
      </div>
      <section className="text-center mt-4">
        <h2 className="h4">回答する</h2>
        {answer === null ? (
          <form onSubmit={handleSubmit}>
            <textarea
              className="form-control"
              placeholder="おげんきですか？"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            ></textarea>
            <div className="m-3">
              {isSending ? (
                <div className="spinner-border text-secondary" role="status"></div>
              ) : (
                  <button type="submit" className="btn btn-primary">
                    回答する
                  </button>
                )}
            </div>
          </form>
        ) : (
          <div className="card">
            <div className="card-body text-left">{answer.body}</div>
          </div>
        )}
      </section>
    </Layout>
  )
}

export default QuestionsShow;