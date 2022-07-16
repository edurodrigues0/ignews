import { fireEvent, render, screen } from '@testing-library/react';
import { signIn, useSession } from 'next-auth/client';

import { SubscribeButton } from '.';
import { mocked } from 'jest-mock';
import { useRouter } from 'next/router';

jest.mock('next-auth/client');
jest.mock('next/router');

describe('SubscribeButton component', () => {
  it('render correctly', () => {
    const useSessionMocked = mocked(useSession)

    useSessionMocked.mockReturnValueOnce([null, false])

    render(
      <SubscribeButton />
    )
  
    expect(screen.getByText('Subscribe now')).toBeInTheDocument();
  })

  it('redirects user to sign in when not authenticated', () => {
    const useSessionMocked = mocked(useSession)

    useSessionMocked.mockReturnValueOnce([null, false])
    
    const signInMocked = mocked(signIn)
    
    render(
      <SubscribeButton />
    )
    const subscribeButton = screen.getByText('Subscribe now')
    
    fireEvent.click(subscribeButton)

    expect(signInMocked).toHaveBeenCalled()
  })

  it('redirects to posts when user already has a subiscription', () => {
    const useRouterMocked = mocked(useRouter)
    const useSessionMocked = mocked(useSession);

    const pushMock = jest.fn();

    useSessionMocked.mockReturnValueOnce([
      { 
        user: {
          name: 'John Doe', 
          email: 'john.doe@example.com'
        }, 
        expires: 'fake-expires', 
        activeSubscription: 'fake-active-subscription'
      },
      false
    ])

    useRouterMocked.mockReturnValueOnce({
      push: pushMock
    } as any)

    render(<SubscribeButton />)

    const subscribeButton = screen.getByText('Subscribe now')
    
    fireEvent.click(subscribeButton)

    expect(pushMock).toHaveBeenCalled()
  })
})
