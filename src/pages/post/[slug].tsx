import { GetStaticPaths, GetStaticProps } from 'next';
import Header from '../../components/Header';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post?: Post;
}

export default function Post({ post }: PostProps) {
  if (!post) {
    return (
      <div className={styles.load}>
        <img src="/load.png" alt="load icon" />
        <h1>...Carregando</h1>
      </div>
    );
  }
  return (
    <>
      <Head>{<title>{post?.data.title}</title>}</Head>

      <Header />

      <h1 className={styles.hide}>Carregando...</h1>

      <img
        src={post?.data.banner.url}
        alt="background"
        className={styles.background}
      />

      <main className={styles.posts}>
        <article className={styles.posts}>
          <h1>{post?.data.title}</h1>
          <div className={styles.info}>
            <FiCalendar className={styles.icon} />
            <time>{post?.first_publication_date}</time>
            <FiUser className={styles.icon} />
            <p>{post?.data.author}</p>
            <FiClock className={styles.icon} />
            <time>3 min</time> {/**fazer a conta do tempo aqui :D */}
          </div>
          {post?.data.content.map(content => {
            return (
              <section key={content.heading}>
                <h2>{content.heading}</h2>
                {content.body.map(body => {
                  return (
                    <div
                      key={Math.random()}
                      dangerouslySetInnerHTML={{ __html: body.text }}
                    />
                  );
                })}
                <p />
              </section>
            );
          })}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.content'],
      pageSize: 2,
    }
  );

  const slugsUids = posts.results.reduce((antPost, post) => {
    return [...antPost, { params: { slug: post.slugs[0] } }];
  }, []);

  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {});

  // var post = {
  //   first_publication_date: response.first_publication_date,
  //   /*first_publication_date: format(
  //     new Date(response.first_publication_date),
  //     'dd MMM yyyy',
  //     {
  //       locale: ptBR,
  //     }
  //   )*/ data: {
  //     title: response.data.title,
  //     banner: {
  //       url: response.data.banner.url,
  //     },
  //     author: response.data.author,
  //     content: response.data.content.map(content => {
  //       return {
  //         heading: content.heading,
  //         body: content.body.map(body => {
  //           const textTemp = RichText.asText([{ ...body }]);
  //           return textTemp ? { text: textTemp } : null;
  //         }),
  //       };
  //     }),
  //   },
  //   uid: response.uid,
  // };

  var post = {
    first_publication_date: response.first_publication_date,
    /*first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    )*/ data: {
      subtitle: response.data.subtitle,
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        };
      }),
    },
    uid: response.uid,
  };

  return {
    props: { post },
  };
};
