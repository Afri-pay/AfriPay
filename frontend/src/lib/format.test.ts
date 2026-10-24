import { addressGroups, formatAmount, shortAddress, stroopsToXlm, totalWithFee } from './format';

describe('display formatting', () => {
  it('formats amounts without floating point', () => {
    expect(formatAmount('1234.5000000')).toBe('1,234.50');
    expect(formatAmount('0.0000001')).toBe('0.0000001');
    expect(formatAmount('100')).toBe('100.00');
    expect(formatAmount('not-a-number')).toBe('0.00');
  });
  it('converts stroops and totals exactly', () => {
    expect(stroopsToXlm('200')).toBe('0.00002');
    expect(stroopsToXlm('12345678901')).toBe('1,234.5678901');
    expect(totalWithFee('2', '200')).toBe('2.00002');
    expect(totalWithFee('0.1', '100')).toBe('0.10001');
    expect(totalWithFee('abc', '100')).toBeNull();
  });
  it('shortens and groups addresses', () => {
    const address = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';
    expect(shortAddress(address)).toBe('GABCD…STUVW');
    expect(addressGroups(address).join('')).toBe(address);
    expect(addressGroups(address)[0]).toBe('GABC');
  });
});
