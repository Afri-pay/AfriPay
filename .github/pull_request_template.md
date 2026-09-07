name: Pull request
about: Propose a change to AfriPay
title: ""
labels: []
body:
  - type: markdown
    attributes:
      value: Thanks for contributing to AfriPay.

  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: What does this PR do?
    validations:
      required: true

  - type: textarea
    id: issue
    attributes:
      label: Related issue
      description: "Fixes #123 or relates to #456"
    validations:
      required: false

  - type: textarea
    id: implementation
    attributes:
      label: Implementation notes
      description: Key design decisions or trade-offs
    validations:
      required: false

  - type: textarea
    id: tests
    attributes:
      label: Tests
      description: How was this tested?
      placeholder: |
        - cd backend && npm test
        - cd frontend && npm test
        - cd contracts && cargo test
    validations:
      required: true

  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots
      description: If UI changed, attach before/after screenshots
    validations:
      required: false

  - type: textarea
    id: security
    attributes:
      label: Security considerations
      description: Any auth, webhook, wallet, or contract security impact?
    validations:
      required: false

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: I have run relevant tests locally
          required: true
        - label: I updated documentation if behavior or setup changed
          required: false
        - label: I did not commit secrets or credentials
          required: true
        - label: I documented breaking changes below (if any)
          required: false

  - type: textarea
    id: breaking
    attributes:
      label: Breaking changes
      description: Leave empty if none
