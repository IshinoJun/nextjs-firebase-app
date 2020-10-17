import dayjs from 'dayjs';
import firebase from 'firebase'
import "firebase/firestore";
import { NextPage } from 'next'
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import { useAuthentication } from '../../hooks/authentication'
import { Question } from '../../models/Question'

const QuestionsReceived:NextPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isPaginationFinished, setIsPaginationFinished] = useState(false);
  const scrollContainerRef = useRef(null);

  const { user } = useAuthentication();

  const createBaseQuery = () => {
    return firebase
      .firestore()
      .collection('questions')
      .where('receiverUid', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(10)
  }

  const appendQuestions = (
    snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>
  ) => {
    const gotQuestions = snapshot.docs.map((doc) => {
      const question = doc.data() as Question
      question.id = doc.id
      return question
    })
    setQuestions(questions.concat(gotQuestions))
  }

  const loadQuestions = () => {
    void (async (): Promise<void> => {
      let snapshot;
      try {
        snapshot = await createBaseQuery().get()
      } catch (err) {
        return;
      } 

      if (snapshot.empty) {
        setIsPaginationFinished(true)
        return
      };

      appendQuestions(snapshot)
    })();
  }

  const loadNextQuestions = () => {
    if (questions.length === 0) return;
    
    const lastQuestion = questions[questions.length - 1];
    let snapshot;

    void (async (): Promise<void> => {
      try {
        snapshot = await createBaseQuery()
          .startAfter(lastQuestion.createdAt)
          .get()
      } catch (err) {
        return;
      }

      if (snapshot.empty) {
        setIsPaginationFinished(true)
        return
      };

      appendQuestions(snapshot)
    })();
  }

  const handleScroll = () => {
    if (isPaginationFinished) {
      return
    }

    const container = scrollContainerRef.current
    if (container === null) {
      return
    }

    const rect = container.getBoundingClientRect()
    if (rect.top + rect.height > window.innerHeight) {
      return
    }

    loadNextQuestions();
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [questions, scrollContainerRef.current, isPaginationFinished])


  useEffect(() => {
    if (!process.browser) {
      return
    }
    if (user === null) {
      return
    }

    loadQuestions();
  }, [process.browser, user]);

  return (
    <Layout>
      <h1 className="h4"></h1>

      <div className="row justify-content-center">
        <div className="col-12 col-md-6" ref={scrollContainerRef}>
          {questions.map((question) => (
            <Link
              href="/questions/[id]"
              as={`/questions/${question.id}`}
              key={question.id}
            >
              <a>
                <div className="card my-3">
                  <div className="card-body">
                    <div className="text-truncate">{question.body}</div>
                    <div className="text-muted text-right">
                      <small>{dayjs(question.createdAt.toDate()).format('YYYY/MM/DD HH:mm')}</small>
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default QuestionsReceived;