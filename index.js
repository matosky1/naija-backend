require('dotenv').config();

const { Client, Environment } = require('square');

const client = new Client({
  accessToken: process.env.ACCESS_TOKEN,
  environment: Environment.Production
});

// Get the currency for the configured location
async function getLocationCurrency() {
  try {
    const { result } = await client.locationsApi.retrieveLocation(process.env.LOCATION_ID);
    return result.location.currency;
  } catch (error) {
    console.error('Error retrieving location currency:', error);
    return null;
  }
}

// Get the first available subscription plan variation ID
async function getFirstSubscriptionPlanVariationId() {
  try {
    const { result } = await client.catalogApi.listCatalog(undefined, 'SUBSCRIPTION_PLAN_VARIATION');
    if (result.objects && result.objects.length > 0) {
      // You could filter by name here if you have multiple plans
      return result.objects[0].id;
    }
    console.error('❌ No subscription plan variations found in catalog.');
    return null;
  } catch (error) {
    console.error('Error retrieving subscription plan variation ID:', error);
    return null;
  }
}

async function createCustomer(name, lastname, email) {
  try {
    const { result } = await client.customersApi.createCustomer({
      givenName: name,
      familyName: lastname,
      emailAddress: email
    });
    return result;
  } catch (error) {
    console.error('Error creating customer:', error);
    return null;
  }
}

async function createOrderTemplate(quantity, name, price) {
  try {
    const currency = await getLocationCurrency();
    if (!currency) {
      console.error('❌ Could not determine location currency.');
      return null;
    }

    const { result } = await client.ordersApi.createOrder({
      order: {
        locationId: process.env.LOCATION_ID,
        referenceId: '12346',
        state: 'DRAFT',
        lineItems: [
          {
            quantity,
            name,
            basePriceMoney: {
              amount: BigInt(price),
              currency
            }
          }
        ]
      },
      idempotencyKey: '1234567890'
    });
    return result;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
}

async function createSubscription(customerId, orderId, planId) {
  try {
    const { result } = await client.subscriptionsApi.createSubscription({
      idempotencyKey: '123456',
      locationId: process.env.LOCATION_ID,
      customerId,
      planVariationId: planId,
      phases: [
        {
          ordinal: BigInt(0),
          orderTemplateId: orderId
        }
      ]
    });
    return result;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

// Main execution flow
(async () => {
  console.log('🚀 Starting Square API test...');

  const customer = await createCustomer('Ado', 'I am', 'codingwithado@gmail.com');
  console.log('Customer API response:', customer);
  if (!customer) return;

  const order = await createOrderTemplate('1', 'Patreon', 100);
  console.log('Order API response:', order);
  if (!order) return;

  const planVariationId = await getFirstSubscriptionPlanVariationId();
  if (!planVariationId) return;

  const subscription = await createSubscription(
    customer.customer.id,
    order.order.id,
    planVariationId
  );
  console.log('Subscription API response:', subscription);
})();  

