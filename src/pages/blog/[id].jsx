"use client"

import Layouts from "@layouts/Layouts";

import { getAllPostsIds, getPostData, getRelatedPosts } from "@library/posts";
import Date from '@library/date';
import ImageView from "@components/ImageView";
import { FacebookShareButton, FacebookIcon } from "next-share";

import PageBanner from "@components/PageBanner";
import globalThis from "the-global-object";
import appData from "@data/app.json";

const getHref = () => globalThis.location;

const ShareButton = () => <FacebookShareButton url={getHref()} quote={"Share"} hashtag={"#sunriseobx"}><FacebookIcon size={32} round /></FacebookShareButton>

const PostsDetail = ( props ) => {
  
  const postData = props.data;

  return (
    <Layouts>
      <PageBanner 
        pageImage={postData?.image } 
        pageTitle={postData?.title} 
        pageDesc={postData?.description} 
        metaDescription={postData?.description}
        metaUrl={props?.url}
      />

      {/* Blog Style Three Start */}
      <section className="gap blog-style-one blog-detail detail-page">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <div className="blog-post ">
                <div className="blog-image">
                  <figure>
                    <img src={postData?.image} alt={postData?.title} />
                  </figure>
                </div>
                <div className="blog-data">
                  <span className="blog-date"><Date dateString={postData?.date} /></span>
                  <h2>{postData?.title}</h2>
                  <div className="blog-author d-flex-all justify-content-start">
                    <div className="author-img">
                      <figure>
                        <img src={postData.author.avatar} alt={postData?.author?.name} />
                      </figure>
                    </div>
                    <div className="details">
                      <h3> <span>by</span> {postData?.author?.name}</h3>
                    </div>
                  </div>
                </div>
                
                <div className="blog-detail-content" dangerouslySetInnerHTML={{ __html: postData?.contentHtml }} />

                {typeof postData.gallery != "undefined" &&
                  <>
                    {postData?.gallery?.enabled == 1 &&
                      <div className="row justify-content-center">
                          {postData?.gallery?.items?.map((item, key) => (
                          <div key={`gallery-item-${key}`} className={ postData?.gallery?.cols == 3 ? "col-lg-4" : "col-lg-6"}>
                            <figure>
                              <a data-fancybox="gallery" href={item.image}>
                                <img src={item.image} alt={item.alt} />
                              </a>
                            </figure>
                          </div>
                          ))}
                      </div>
                    }
                  </>
                }

                {typeof postData?.additional != "undefined" &&
                  <>
                    {postData?.additional?.enabled == 1 &&
                    <div className="blog-detail-content" dangerouslySetInnerHTML={{ __html: postData.additional.content }} />
                    }
                  </>
                }

                <div className="category shape social-medias">
                    <p>
                      Share this:
                    </p>
                    <ul>
                      <li><ShareButton /></li>
                    </ul>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Blog Style Three End */}
      
      <ImageView />
    </Layouts>
  );
};

export default PostsDetail;

export async function getStaticPaths() {
    const paths = getAllPostsIds()

    return {
      paths,
      fallback: false
    }
}

export async function getStaticProps(req) {
  const { params } = req;
    const postData = await getPostData(params.id)
    const relatedPosts = await getRelatedPosts(params.id)


    return {
      props: {
        data: postData,
        related: relatedPosts,
        url: `blog/${params.id}`
      }
    }
}
