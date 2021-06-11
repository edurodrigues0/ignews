import { query as qy } from 'faunadb';
import { fauna } from "../../../services/fauna";
import { stripe } from '../../../services/stripe';

export async function saveSubscription(
    subscriptionId: string,
    customerId: string,
    createAction = false,
) {
    const userRef = await fauna.query(
        qy.Select(
            "ref",
            qy.Get(
                qy.Match(
                    qy.Index('user_by_stripe_customer_id'),
                    customerId
                )
            )
        )
    )

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    const subscriptionData = {
        id: subscription.id,
        userId: userRef,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
    }

    if(createAction) {
        await fauna.query(
            qy.Create(
                qy.Collection('subscriptions'),
                { data: subscriptionData }
            )
        )
    } else {
        await fauna.query(
            qy.Replace(
                qy.Select(
                    "ref",
                    qy.Get(
                        qy.Match(
                            qy.Index('subscription_by_id'),
                            subscriptionId,
                        )
                    )
                ),
                { data: subscriptionData}
            )
        )
    }
}