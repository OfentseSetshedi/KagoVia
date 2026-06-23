ai-home-planner/
├── frontend/                          # Client-side application
│   ├── pages/                         # Main HTML pages
│   │   ├── index.html                 # Landing page
│   │   ├── planner.html               # Home planning interface
│   │   ├── dashboard.html             # User dashboard
│   │   ├── quotations.html            # Cost quotations page
│   │   └── suppliers.html             # Supplier listings page
│   │
│   ├── components/                    # Reusable UI blocks
│   │   ├── navbar/                    # Navigation bar component
│   │   ├── sidebar/                   # Sidebar menu component
│   │   ├── modals/                    # Popup modals
│   │   ├── forms/                     # Form components
│   │   ├── cards/                     # Reusable cards
│   │   ├── loaders/                   # Loading animations
│   │   └── notifications/             # Alerts and toasts
│   │
│   ├── styles/                        # Styling system
│   │   ├── global.css                 # Global styles
│   │   ├── tailwind.css               # Tailwind utility styles
│   │   ├── variables.css              # CSS variables
│   │   └── animations.css             # UI animations
│   │
│   ├── scripts/                       # Frontend logic
│   │   ├── main.js                    # Main entry script
│   │   ├── planner.js                 # Planner logic
│   │   ├── floorplan-viewer.js        # :contentReference[oaicite:0]{index=0} rendering engine
│   │   ├── socket-client.js           # :contentReference[oaicite:1]{index=1} live updates
│   │   ├── auth.js                    # Authentication logic
│   │   └── api.js                     # API communication logic
│   │
│   ├── assets/                        # Static assets
│   │   ├── images/                    # General images
│   │   ├── icons/                     # Icons
│   │   ├── floor-plans/               # Generated floor plans
│   │   └── materials/                 # Material textures/previews
│   │
│   └── utils/                         # Helper functions
│       ├── validators.js              # Input validation
│       ├── formatters.js              # Data formatting
│       └── calculations.js            # Cost and area calculations
│
├── backend/                           # Server-side logic
│   ├── routes/                        # API endpoints
│   │   ├── auth.routes.js             # Authentication routes
│   │   ├── plans.routes.js            # Floor plan routes
│   │   ├── ai.routes.js               # AI API routes
│   │   ├── quotations.routes.js       # Cost quotation routes
│   │   ├── materials.routes.js        # Material routes
│   │   └── suppliers.routes.js        # Supplier routes
│   │
│   ├── controllers/                   # Business logic handlers
│   │   ├── auth.controller.js         # Auth controller
│   │   ├── plans.controller.js        # Plan generation controller
│   │   ├── ai.controller.js           # AI orchestration controller
│   │   ├── quotation.controller.js    # Cost calculation controller
│   │   ├── materials.controller.js    # Material extraction controller
│   │   └── suppliers.controller.js    # Supplier management controller
│   │
│   ├── models/                        # Database models
│   │   ├── mongo/                     # MongoDB models
│   │   │   ├── User.js                # User schema
│   │   │   ├── Project.js             # Project schema
│   │   │   ├── FloorPlan.js           # Floor plan schema
│   │   │   └── Job.js                 # Queue jobs schema
│   │   │
│   │   └── sql/                       # SQL table definitions
│   │       ├── Material.sql           # Material table
│   │       ├── Supplier.sql           # Supplier table
│   │       └── Pricing.sql            # Pricing table
│   │
│   ├── middleware/                    # Express middleware
│   │   ├── auth.middleware.js         # JWT auth protection
│   │   ├── error.middleware.js        # Error handling
│   │   ├── upload.middleware.js       # File upload handling
│   │   └── validation.middleware.js   # Request validation
│   │
│   ├── services/                      # Core service logic
│   │   ├── ai/                        # AI integrations
│   │   │   ├── openai.service.js      # :contentReference[oaicite:2]{index=2} API integration
│   │   │   ├── plan-generator.service.js # AI floor plan generation
│   │   │   └── material-extractor.service.js # AI material extraction
│   │   │
│   │   ├── quotation/                 # Pricing logic
│   │   │   ├── estimator.service.js   # Cost estimator
│   │   │   └── pricing.service.js     # Supplier pricing engine
│   │   │
│   │   └── suppliers/                 # Supplier integrations
│   │       └── supplier.service.js    # Supplier API communication
│   │
│   ├── sockets/                       # Real-time communication
│   │   ├── ai-status.socket.js        # AI progress updates
│   │   └── quotation.socket.js        # Live quotation updates
│   │
│   ├── jobs/                          # Async task processing
│   │   ├── generate-plan.job.js       # Floor plan generation jobs
│   │   ├── extract-materials.job.js   # Material extraction jobs
│   │   └── calculate-cost.job.js      # Cost calculation jobs
│   │
│   ├── config/                        # Configuration files
│   │   ├── db.js                      # Database connections
│   │   ├── env.js                     # Environment variables
│   │   ├── socket.js                  # Socket.IO config
│   │   └── ai-config.js               # AI API configs
│   │
│   └── utils/                         # Backend helper functions
│       ├── logger.js                  # Logging system
│       ├── parser.js                  # AI response parser
│       └── helpers.js                 # Utility helpers
│
├── database/                          # Database management
│   ├── mongodb/                       # MongoDB configs
│   │   ├── schemas/                   # Mongo schemas
│   │   └── seeders/                   # Mongo seed data
│   │
│   └── sql/                           # SQL configs
│       ├── migrations/                # Table migrations
│       ├── seeders/                   # SQL seed data
│       └── procedures/                # SQL stored procedures
│
├── storage/                           # File storage
│   ├── floor-plans/                   # Generated floor plans
│   ├── quotations/                    # Saved quotations
│   ├── generated-images/              # AI-generated visuals
│   └── temp/                          # Temporary uploads
│
├── tests/                             # Testing suite
│   ├── unit/                          # Unit tests
│   ├── api/                           # API endpoint tests
│   └── e2e/                           # End-to-end tests
│
├── deployment/                        # Deployment configs
│   ├── docker/                        # :contentReference[oaicite:3]{index=3} setup
│   ├── kubernetes/                    # Kubernetes scaling configs
│   ├── nginx/                         # :contentReference[oaicite:4]{index=4} reverse proxy setup
│   └── github-actions/                # :contentReference[oaicite:5]{index=5} CI/CD workflows
│
├── docs/                              # Documentation
│   ├── api-docs/                      # API documentation
│   ├── architecture/                  # System architecture docs
│   ├── database/                      # Database design docs
│   └── deployment/                    # Deployment docs
│
├── .env                               # Environment variables
├── .gitignore                         # Git ignore rules
├── package.json                       # Project dependencies
├── server.js                          # Backend entry point
└── README.md                          # Project overview