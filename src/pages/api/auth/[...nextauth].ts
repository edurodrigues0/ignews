import { query as qy } from 'faunadb'

import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';

import { fauna } from '../../../services/fauna';

export default NextAuth({
    providers: [
        Providers.GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            scope: 'read:user',
        }),
    ],
    jwt: {
        signingKey: process.env.SIGNIN_KEY
    },
    callbacks: {
        async session(session) {
            try {
                const userActiveSubscription = await fauna.query(
                    qy.Get(
                        qy.Intersection([
                            qy.Match(
                                qy.Index('subscription_by_user_ref'),
                                qy.Select(
                                    'ref',
                                    qy.Get(
                                        qy.Match(
                                            qy.Index('user_by_email'),
                                            qy.Casefold(session.user.email)
                                        )
                                    )
                                )
                            ),
                            qy.Match(
                                qy.Index('subscription_by_status'),
                                'active'
                            )
                        ])
                    )
                )
    
                return {
                    ...session,
                    activeSubscription: userActiveSubscription
                }
            } catch {
                return {
                    ...session,
                    activeSubscription: null,
                }
            }
        },
        async signIn(user, account, profile) {
            const { email } = user
            
            try {
                await fauna.query(
                    qy.If(
                        qy.Not(
                            qy.Exists(
                                qy.Match(
                                    qy.Index('user_by_email'),
                                    qy.Casefold(user.email)
                                )
                            )
                        ),
                        qy.Create(
                            qy.Collection('users'),
                            { data: { email } }
                        ),
                        qy.Get(
                            qy.Match(
                                qy.Index('user_by_email'),
                                qy.Casefold(user.email)
                            )
                        )
                    )
                )
                return true
            } catch {
                return false
            }
        },
    }
})