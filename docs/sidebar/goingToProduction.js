module.exports = [
  {
    type: "category",
    collapsible: false,
    label: "On-Premise Deployment",
    items: [
      {
        type: "category",
        collapsible: true,
        label: "Deploy",
        link: {
          type: "doc",
          id: "going-to-production/deploy/deploy",
        },
        items: [
          "going-to-production/deploy/linux",
          "going-to-production/deploy/windows",
          "going-to-production/deploy/aws",
          "going-to-production/deploy/digitalocean",
          "going-to-production/deploy/docker-compose",
        ],
      },
      {
        type: "category",
        collapsible: true,
        label: "Hardware & Software Requirements",
        link: {
          type: "doc",
          id: "going-to-production/requirements/requirements",
        },
        items: ["going-to-production/requirements/benchmarking"],
      },
      "going-to-production/environment-variables",
      "going-to-production/updating",
    ],
  },
  // {
  //   type: "category",
  //   collapsible: false,
  //   label: "Development Lifecycle",
  //   items: [
  //     {
  //       type: "category",
  //       collapsible: true,
  //       label: "Environments",
  //       items: [
  //         "going-to-production/development-lifecycle/environments/read-write-production",
  //         "going-to-production/development-lifecycle/environments/read-only-production",
  //         "going-to-production/development-lifecycle/environments/multi-stage-environment",
  //       ],
  //     },
  //     "going-to-production/development-lifecycle/versioning",
  //     "going-to-production/development-lifecycle/import-export",
  //   ],
  // },
  // {
  //   type: "category",
  //   collapsible: false,
  //   label: "Migrations",
  //   items: [
  //     "going-to-production/migrations/chatbot-migrations",
  //     "going-to-production/migrations/environment-migrations",
  //   ],
  // },
]
