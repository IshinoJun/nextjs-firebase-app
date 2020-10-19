import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import Layout from '../../components/Layout'
import { User } from '../../models/User'

type Query = {
  uid: string
}

const UserShow: NextPage = () => {
  const [user, setUser] = useState<User>(null)
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const router = useRouter()
  const query = router.query as Query

  const handleChangeBody = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    void (async (): Promise<void> => {
      setIsSending(true)
      try {
        await firebase.firestore().collection('questions').add({
          senderUid: firebase.auth().currentUser.uid,
          receiverUid: user.uid,
          body,
          isReplied: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
        setBody('')

        toast.success('質問を送信しました。', {
          position: 'bottom-left',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        })
        
      } catch (err) {
        return;
      } finally {
        setIsSending(false);
      }
    })();

  }


  useEffect(() => {
    if (query.uid === undefined) return

    console.log(query);
    
    async function loadUser() {
      const doc = await firebase
        .firestore()
        .collection('users')
        .doc(query.uid)
        .get()

      if (!doc.exists) {
        return
      }

      const gotUser = doc.data() as User
      gotUser.uid = doc.id
      setUser(gotUser)
    }
    loadUser()
  }, [query.uid])

  return (
    <Layout>
      {user && (
        <>
          <div className="text-center">
            <h1 className="h4">{user.name}さんのページ</h1>
            <div className="m-5">{user.name}さんに質問しよう！</div>
          </div>
          <div className="row justify-content-center mb-3">
            <div className="col-12 col-md-6">
              <form onSubmit={handleSubmit}>
                <textarea
                  className="form-control"
                  placeholder="おげんきですか？"
                  rows={6}
                  value={body}
                  required
                  onChange={handleChangeBody}
                ></textarea>
                <div className="m-3">
                  {isSending ? (
                    <div className="spinner-border text-secondary" role="status">
                      <span className="sr-only"/>
                    </div>
                  ) : (
                    <button type="submit" className="btn btn-primary">
                      質問を送信する
                    </button>
                  )}
                </div>
              </form>
              <p>
                <Link href="/users/me">
                  <a className="btn btn-link">自分もみんなに質問してもらおう！</a>
                </Link>
              </p>
            </div>
          </div>
        </>
      )}
    </Layout>
  )
}

export default UserShow;