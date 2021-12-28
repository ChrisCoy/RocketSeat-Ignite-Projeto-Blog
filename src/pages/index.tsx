import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

//import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function showMorePosts() {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const postsTemp = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: data.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });

        setNextPage(data.next_page);
        setPosts([...posts, ...postsTemp]);
      });
  }

  return (
    <main className={styles.container}>
      <div className={styles.posts}>
        <nav className={styles.header}>
          <img src="/logo.svg" alt="logo" />
        </nav>

        {posts.map(post => {
          return (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div>
                  <FiCalendar className={styles.icon} />
                  <time>{/* {post.first_publication_date} */}15 mar 2021</time>
                  <FiUser className={styles.icon} />
                  <p>{post.data.author}</p>
                </div>
              </a>
            </Link>
          );
        })}

        {nextPage != null && (
          <strong onClick={() => showMorePosts()}>Carregar mais posts</strong>
        )}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 2,
    }
  );

  const posts = postsResponse.results.map<Post>(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      /*first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),*/
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
    revalidate: 10,
  };
};
