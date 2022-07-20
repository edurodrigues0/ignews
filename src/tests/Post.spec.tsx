import Post, { getServerSideProps } from '../pages/posts/[slug]';
import { render, screen } from '@testing-library/react';

import React from 'react';
import { getPrismicClient } from '../services/prismic';
import { getSession } from 'next-auth/client';
import { mocked } from 'jest-mock';

const post = {
  slug: 'my-new-post',
  title: 'My New Post',
  content: '<p>Post content</p>',
  updatedAt: '10 de Abril'
}

jest.mock('next-auth/client')
jest.mock('../services/prismic')

describe('Post page', () => {
  it('renders correctly', () => {


    render(<Post post={post} />)

    expect(screen.getByText("My New Post")).toBeInTheDocument()
    expect(screen.getByText("Post content")).toBeInTheDocument()
  });

  it('redirects users if no subscription is found', async () => {
    const getSessionMocked = mocked(getSession);
    
    getSessionMocked.mockReturnValueOnce(null);
    
    const response = await getServerSideProps({
      params: {
        slug: 'my-new-post'
      }
    } as any);
    
    expect(response).toEqual(
      expect.objectContaining({
        redirect: expect.objectContaining({
          destination: '/'
        })
      })
    )
  });
    
  it('loads initial data', async () => {
    const getSessionMocked = mocked(getSession);
    const getPrismicClientMocked = mocked(getPrismicClient);
    
    getSessionMocked.mockReturnValueOnce({
      activeSubscription: 'fake-active-subscription'
    } as any);
    
    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [{
            type: 'heading',
            text: 'My New Post'
          }],
          content: [{
            type: 'paragraph',
            text: 'Post content'
          }],
        },
        last_publication_date: '04-01-2022'
      })
    } as any)

    const response = await getServerSideProps({
      params: {
        slug: 'my-new-post'
      }
    } as any);
    
    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: 'my-new-post',
            title: 'My New Post',
            content: '<p>Post content</p>',
            updatedAt: '01 de abril de 2022'
          }
        }
      })
    )
  })
})