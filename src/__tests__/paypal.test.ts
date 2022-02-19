import paypal from '../index';

test('Paypal "createToken" is properly defined', () => {
  expect(paypal.createToken).toBeDefined();
});

test('Paypal "createTransaction" is properly defined', () => {
  expect(paypal.createTransaction).toBeDefined();
});
