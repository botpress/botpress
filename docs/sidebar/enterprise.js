module.exports = [
  {
    type: "category",
    collapsible: false,
    label: "Licensing",
    items: ["enterprise/licensing/enterprise-licensing"]
  },
  {
    type: "category",
    collapsible: false,
    label: "User Management and Security",
    items: [
      {
        type: "category",
        collapsible: true,
        label: "Role-Based Access Control (RBAC)",
        items: [
          "enterprise/user-management-and-security/role-based-access-control/roles",
          "enterprise/user-management-and-security/role-based-access-control/collaborators"
        ]
      },
      {
        type: "category",
        collapsible: true,
        label: "Authentication Methods",
        link: {
          type: "doc",
          id: "enterprise/user-management-and-security/authentication-methods/authentication-methods"
        },
        items: [
          "enterprise/user-management-and-security/authentication-methods/basic-authentication",
          "enterprise/user-management-and-security/authentication-methods/saml",
          "enterprise/user-management-and-security/authentication-methods/oauth2",
          "enterprise/user-management-and-security/authentication-methods/ldap"
        ]
      },
      {
        type: "category",
        collapsible: true,
        label: "Single-Sign On (SSO)",
        items: [
          "enterprise/user-management-and-security/single-sign-on/sso-with-google-oauth2",
          "enterprise/user-management-and-security/single-sign-on/sso-with-github-oauth2",
          "enterprise/user-management-and-security/single-sign-on/azure-oauth2"
        ]
      }
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Server and CICD Management",
    items: [
      "enterprise/server-and-cicd-management/production-checklist",
      "enterprise/server-and-cicd-management/monitoring",
      "enterprise/server-and-cicd-management/alerting",
      {
        type: "category",
        collapsible: true,
        label: "Pipelines",
        items: [
          "enterprise/server-and-cicd-management/pipelines/configure-pipeline",
        ]
      }
    ]
  },
  {
    type: "category",
    collapsible: false,
    label: "Advanced Chatbots",
    items: [
      {
        type: "category",
        collapsible: true,
        label: "Multi-lingual Chatbots",
        items: [
          "enterprise/advanced-chatbots/multi-lingual-chatbots/switching-languages"
        ]
      }
    ]
  }
]
