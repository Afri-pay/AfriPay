# Contributing to AfriPay 🤝

Thank you for your interest in contributing to AfriPay! We're building the future of payments in Africa, and we'd love your help. Whether you're fixing a typo or building a major feature, every contribution matters.

AfriPay is part of the **Stellar Wave Program on Drips Network** - you earn real rewards for your contributions. Let's build something amazing together! 🚀

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Stellar Wave Rewards](#stellar-wave-rewards)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Community](#community)

---

## 📜 Code of Conduct

### Our Pledge

AfriPay is built by Africans, for Africa. We're committed to making this a welcoming, inclusive community where everyone can contribute regardless of experience level, background, or identity.

**We expect all contributors to:**
- Be respectful and kind in all interactions
- Welcome newcomers and help them succeed
- Give and receive constructive feedback gracefully
- Focus on what's best for the African communities we serve
- Celebrate diversity and different perspectives

**Unacceptable behavior:**
- Harassment, discrimination, or offensive language
- Trolling, insults, or personal attacks
- Publishing private information without consent
- Any conduct harmful to the community

**Violations?** Email conduct@afripay.io. All reports are confidential.

---

## 🎯 How Can I Contribute?

### 🐛 Found a Bug?

Bugs happen! Help us squash them:

1. **Check existing issues** - Someone might have reported it already
2. **Create a new issue** - Use our bug report template
3. **Be specific** - Include:
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Screenshots or error messages
   - Device/browser info

**Example:**
```
Title: Payment fails when amount includes decimals

Steps to reproduce:
1. Go to Send Money page
2. Enter amount: 1500.50 NGN
3. Click "Send"
4. Error appears: "Invalid amount"

Expected: Payment should process
Actual: Shows error message

Device: iPhone 12, iOS 16
Browser: Safari
```

### 💡 Have an Idea?

We love new ideas! Before building:

1. **Search existing suggestions** - Avoid duplicates
2. **Create a feature request** - Explain:
   - What problem it solves
   - Who benefits (users, merchants, developers)
   - How it might work
3. **Discuss first** - Get feedback before coding

**Good feature requests:**
- "Add Swahili language support for Kenya users"
- "Enable scheduled payments for rent/bills"
- "Show transaction history as downloadable PDF"

### 💻 Ready to Code?

**For beginners:**
- Look for `good first issue` label
- Start with documentation or tests
- Ask questions in Discord - we're friendly!

**For experienced devs:**
- Check `help wanted` issues
- Tackle `medium`, `hard`, or `epic` challenges
- Review other contributors' PRs

### 📝 Improve Documentation

Documentation helps everyone:
- Fix typos and broken links
- Add code examples
- Write tutorials (How to integrate AfriPay)
- Translate to local languages
- Improve API docs

### 🎨 Design Contributions

Make AfriPay beautiful and usable:
- UI/UX improvements
- Mobile-first design tweaks
- Accessibility enhancements
- Marketing materials
- Localization for African markets

### 🧪 Quality Assurance

Help us ship bug-free code:
- Write automated tests
- Manual testing on different devices
- Test in low-bandwidth scenarios (2G/3G)
- Report edge cases

---

## 🌊 Stellar Wave Rewards

AfriPay participates in the Stellar Wave Program - **you earn rewards for merged contributions!**

### How It Works

1. **Browse Issues** - Each has a complexity label
2. **Claim One** - Comment "I'd like to work on this"
3. **Get Assigned** - Maintainer assigns it to you
4. **Build & Submit** - Create your PR
5. **Get Reviewed** - Address feedback
6. **Earn Points** - Merged PR = points in your Drips account
7. **Get Paid** - Points convert to rewards monthly

### Point Values

| Label | Points | Time Estimate | Examples |
|-------|--------|---------------|----------|
| `trivial` | **100** | 30 min - 1 hour | Fix typo, update README, small UI fix |
| `easy` | **250** | 2-4 hours | Add tests, simple component, minor feature |
| `medium` | **500** | 1-2 days | API endpoint, integration, complex UI |
| `hard` | **750** | 3-5 days | Mobile money integration, security feature |
| `epic` | **1000** | 1-2 weeks | Full module, USSD gateway, major feature |

### Rules to Remember

**✅ DO:**
- Claim one issue at a time
- Update the issue if you need help
- Communicate if you need more time
- Ask questions - we're here to help!

**❌ DON'T:**
- Claim multiple issues without finishing first one
- Abandon work without telling us
- Submit low-quality code for quick points
- Copy code without attribution

**Inactive for 7 days?** We may reassign so others can contribute.

---

## 🚀 Getting Started

### Prerequisites

**For Smart Contracts (Rust):**
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Stellar CLI
cargo install --locked stellar-cli

# Verify installation
stellar --version
```

**For Backend/Frontend (Node.js):**
```bash
# Check Node version (need 18+)
node --version

# Install dependencies
npm install
# or
yarn install
```

**For Everything:**
- Git installed
- GitHub account
- Code editor (VS Code recommended)
- Stellar wallet (Freighter for testing)

### Fork & Clone

```bash
# 1. Fork the repo on GitHub (click Fork button)

# 2. Clone YOUR fork
git clone https://github.com/YOUR_USERNAME/afripay-contracts.git
cd afripay-contracts

# 3. Add upstream remote
git remote add upstream https://github.com/afripay/afripay-contracts.git

# 4. Verify remotes
git remote -v
# origin    https://github.com/YOUR_USERNAME/afripay-contracts.git (fetch)
# upstream  https://github.com/afripay/afripay-contracts.git (fetch)
```

### Set Up Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env

# Example .env:
DATABASE_URL=postgresql://localhost/afripay_dev
STELLAR_NETWORK=testnet
STELLAR_HORIZON=https://horizon-testnet.stellar.org
```

### Run Tests

```bash
# Rust contracts
cargo test

# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# All tests passing? You're ready! 🎉
```

---

## 🔄 Development Workflow

### 1. Find an Issue

Browse [open issues](../../issues) and filter by labels:
- `good first issue` - Perfect for newcomers
- `help wanted` - We need help!
- `trivial`, `easy` - Quick wins
- Your skill area: `frontend`, `backend`, `smart-contracts`

### 2. Claim It

Comment on the issue:
```
Hi! I'd like to work on this. 

My approach:
- [Brief explanation of how you'll solve it]

ETA: [When you think you can submit PR]
```

**Wait for assignment** before starting work!

### 3. Create a Branch

```bash
# Sync with latest
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/issue-123-mobile-money-ghana

# Branch naming:
# feature/issue-XXX-description  (new features)
# fix/issue-XXX-description      (bug fixes)
# docs/issue-XXX-description     (documentation)
# test/issue-XXX-description     (tests only)
```

### 4. Make Your Changes

Write clean, working code:

```bash
# Make changes to files
# Test locally as you go
npm run dev

# Lint and format
npm run lint
npm run format
```

**Key principles:**
- Keep changes focused on the issue
- Write self-documenting code
- Add comments for complex logic
- Test thoroughly on your machine

### 5. Commit Your Work

```bash
# Stage changes
git add .

# Commit with clear message
git commit -m "feat: add MTN Mobile Money integration for Ghana (#123)"
```

**Commit Message Format:**
```
<type>: <description> (#issue-number)

[optional detailed explanation]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, semicolons
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

**Good examples:**
```
feat: add Swahili language support (#89)
fix: resolve payment timeout on slow networks (#145)
docs: update mobile money integration guide (#67)
test: add unit tests for escrow contract (#201)
```

### 6. Push and Create PR

```bash
# Push to YOUR fork
git push origin feature/issue-123-mobile-money-ghana

# Go to GitHub and click "Create Pull Request"
```

---

## 📝 Pull Request Process

### Before You Submit

**Checklist:**
- [ ] Code follows our style guide
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Documentation updated (if needed)
- [ ] No merge conflicts with main
- [ ] Commit messages are clear
- [ ] You've tested locally

### PR Template

```markdown
## What does this PR do?
Adds MTN Mobile Money integration for Ghana users

## Related Issue
Closes #123

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Documentation
- [ ] Refactor
- [ ] Test

## How Has This Been Tested?
- Tested on testnet with real MTN Ghana sandbox
- Added unit tests for payment flow
- Tested error cases (insufficient balance, network timeout)
- Tested on slow 3G connection

## Screenshots (if UI change)
[Attach screenshots here]

## Checklist
- [x] Tests pass locally
- [x] Code follows style guide
- [x] Documentation updated
- [x] Self-reviewed
- [x] No console.logs left behind
```

### What Happens Next?

1. **Automated Checks** - CI runs tests and linting
2. **Code Review** - Maintainer reviews within 48-72 hours
3. **Feedback** - Address any requested changes
4. **Approval** - At least one maintainer must approve
5. **Merge** - We merge your PR! 🎉
6. **Points Added** - Issue points go to your Drips account

**Be patient and kind.** Reviews take time, and feedback makes your code better!

---

## 💻 Coding Standards

### Rust (Smart Contracts)

```rust
/// Processes a payment with escrow protection
/// 
/// # Arguments
/// * `amount` - Payment amount in stroops
/// * `sender` - Sender's Stellar address
/// * `recipient` - Recipient's Stellar address
/// 
/// # Returns
/// * `Ok(payment_id)` - Payment ID on success
/// * `Err(Error)` - Error details on failure
pub fn create_payment(
    env: Env,
    amount: i128,
    sender: Address,
    recipient: Address,
) -> Result<u64, Error> {
    // Validate inputs
    if amount <= 0 {
        return Err(Error::InvalidAmount);
    }
    
    // Business logic here
    let payment_id = store_payment(&env, amount, sender, recipient)?;
    
    Ok(payment_id)
}
```

**Standards:**
- Use `cargo fmt` before committing
- Run `cargo clippy` and fix warnings
- Never use `.unwrap()` - use proper error handling
- Document all public functions
- Write descriptive variable names

### TypeScript (Backend/Frontend)

```typescript
/**
 * Processes mobile money payment
 * @param request Payment request details
 * @returns Payment confirmation
 * @throws PaymentError if payment fails
 */
async function processMobileMoneyPayment(
  request: MobileMoneyRequest
): Promise<PaymentResult> {
  // Validate
  validatePaymentRequest(request);
  
  try {
    // Call mobile money API
    const result = await mobileMoneyProvider.charge(request);
    
    // Log success
    logger.info('Payment processed', { id: result.id });
    
    return result;
  } catch (error) {
    logger.error('Payment failed', { error, request });
    throw new PaymentError('Mobile money payment failed', error);
  }
}
```

**Standards:**
- Use ESLint and Prettier (run `npm run lint`)
- TypeScript strict mode enabled
- Prefer `const` over `let`, never `var`
- Use async/await, not callbacks
- Handle all errors with try/catch
- Type everything - avoid `any`

### React Components

```typescript
interface PaymentFormProps {
  onSubmit: (payment: Payment) => Promise<void>;
  currencies: Currency[];
}

export function PaymentForm({ onSubmit, currencies }: PaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit({ amount: parseFloat(amount) });
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor="amount" className="block text-sm font-medium">
        Amount
      </label>
      <input
        id="amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg"
      >
        {loading ? 'Processing...' : 'Send Payment'}
      </button>
    </form>
  );
}
```

**Standards:**
- Functional components with hooks
- TypeScript for all components
- Tailwind CSS for styling
- Accessible (proper labels, ARIA)
- Loading states for async actions
- Error handling with user feedback

### General Rules

- **Clear naming** - `getUserPayments()` not `getData()`
- **Small functions** - Do one thing well
- **DRY principle** - Don't repeat yourself
- **Comments** - Explain WHY, not WHAT
- **No secrets** - Never commit API keys or passwords
- **Error handling** - Always handle errors gracefully

---

## 🧪 Testing Guidelines

### Smart Contracts

```rust
#[test]
fn test_create_payment_success() {
    let env = Env::default();
    let contract = PaymentContract::new(&env);
    
    let amount = 1000i128;
    let sender = Address::random(&env);
    let recipient = Address::random(&env);
    
    let payment_id = contract.create_payment(
        env.clone(),
        amount,
        sender.clone(),
        recipient.clone(),
    ).unwrap();
    
    assert!(payment_id > 0);
    assert_eq!(contract.get_payment_amount(payment_id), amount);
}

#[test]
fn test_create_payment_invalid_amount() {
    let env = Env::default();
    let contract = PaymentContract::new(&env);
    
    let result = contract.create_payment(
        env,
        -100, // Invalid
        Address::random(&env),
        Address::random(&env),
    );
    
    assert!(result.is_err());
}
```

**Requirements:**
- Test happy path AND error cases
- Coverage > 80%
- Run `cargo test` before submitting

### Backend

```typescript
describe('MobileMoneyService', () => {
  it('should process MTN payment successfully', async () => {
    const payment = {
      amount: 5000,
      currency: 'NGN',
      phone: '+2348012345678',
    };
    
    const result = await mobileMoneyService.process(payment);
    
    expect(result.status).toBe('success');
    expect(result.transactionId).toBeDefined();
  });
  
  it('should handle insufficient balance', async () => {
    const payment = { amount: 999999999 };
    
    await expect(
      mobileMoneyService.process(payment)
    ).rejects.toThrow('Insufficient balance');
  });
});
```

**Requirements:**
- Jest for testing
- Mock external APIs
- Test error scenarios
- Coverage > 80%

### Frontend

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('PaymentForm', () => {
  it('submits payment with valid amount', async () => {
    const onSubmit = jest.fn();
    render(<PaymentForm onSubmit={onSubmit} />);
    
    const input = screen.getByLabelText('Amount');
    fireEvent.change(input, { target: { value: '1000' } });
    
    const button = screen.getByText('Send Payment');
    fireEvent.click(button);
    
    expect(onSubmit).toHaveBeenCalledWith({ amount: 1000 });
  });
});
```

**Requirements:**
- React Testing Library
- Test user interactions
- Accessibility tests
- Coverage > 70%

---

## 🌍 Community

### Communication Channels

- **Discord** - [AfriPay Community](https://discord.com/invite/wbTVX2dP9Y) - Daily chat
- **GitHub Discussions** - [Discussions](../../discussions) - Ideas & help
- **Telegram** - [@AfriPayDev](https://t.me/+VzINO9TdD8M2NjQ0) - Quick questions
- **Twitter** - [@AfriPayHQ](https://twitter.com/AfriPayHQ) - Updates (Coming soon)

### Getting Help

**Stuck? No worries!**
1. Check existing issues and discussions
2. Ask in Discord #dev-help channel
3. Comment on your issue
4. Tag maintainers (be patient!)

**We're friendly and want you to succeed!** 🤗

### Recognition

Contributors get:
- Listed in README Contributors section
- Mentioned in release notes
- Shoutouts on Twitter
- AfriPay swag (for significant contributions)
- Invitation to contributor calls
- Priority support

**Top contributors may receive:**
- Speaking opportunities at events
- Recommendation letters
- Direct collaboration with core team
- Early access to features
- Advisory roles

---

## ❓ Questions?

- **General**: [GitHub Discussions](../../discussions)
- **Issue-specific**: Comment on the issue
- **Private**: contribute@afripay.io

---

## 🎉 Thank You!

Every line of code, every bug report, every documentation fix - it all matters. You're not just writing code; you're helping millions of Africans send money home to their families.

**Together, we're building the future of African payments.** 🌍💸

Ready to make an impact? [Browse open issues](../../issues) and start contributing today!

---

*This guide is a living document. See something to improve? Submit a PR!*
