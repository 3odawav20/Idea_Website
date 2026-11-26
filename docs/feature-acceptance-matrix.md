# IDEA feature acceptance matrix

This matrix separates source implementation from verified production behavior. A passing source test does not certify a live account, payment, upload or marketplace transaction.

| Feature | Frontend / backend contract | Source status | Production verification |
| --- | --- | --- | --- |
| Browse catalogue and product details | React catalogue, product routes and source-backed media | Implemented | Browser and live asset checks required |
| Search and filters | React catalogue search and filter logic | Implemented | Exhaustive result and zero-result tests required |
| Customer authentication | `AccountEntry`, PHP account/session API | Integrated | New-account, login, logout, recovery and cross-account tests required |
| Social authentication | Google identity flow and PHP social-auth endpoint | Integrated | Provider credentials, callbacks and real sign-in required |
| Customer profile and favorites | PHP/MySQL account and marketplace contracts | Integrated in source | Verify persistence and ownership with separate accounts |
| Company onboarding and verification | PHP/MySQL platform API and company screens | Integrated in source | Verify document upload, review, approval and tenant isolation |
| Supplier product management | PHP/MySQL marketplace and company dashboard | Integrated in source | Verify create/edit/moderation using real supplier accounts |
| RFQ creation and supplier matching | PHP marketplace request and offer handlers | Integrated in source | Verify quantity, matching, offer totals and buyer/supplier isolation |
| Notifications and inbox | PHP/MySQL account-platform contracts | Integrated in source | Verify delivery, recipient scope and mark-read persistence |
| Private prices | Server-authorized MySQL marketplace response | Integrated in source | Verify admin-only access and supplier isolation |
| Announcements | PHP/MySQL public ticker contract and admin editor | Integrated in source | Verify publish schedule and public rendering on the live domain |
| Advertising requests | PHP/MySQL ad-request contract | Partial | Media upload, fees and external campaign publication remain separate release work |
| Checkout and payments | PHP/MySQL payment state and provider hooks | Partial | No live payment or webhook success is claimed without merchant tests |
| AI room visualizer | PHP/MySQL session, quota and RunPod adapter | Integrated in source | Verify worker contract, real generation, mask safety and ownership on production |
| 3D room designer | React/Three.js client-side scene | Implemented | Browser/device performance and persistence require separate tests |
| Arabic and English | Shared i18n, RTL/LTR and theme tokens | Implemented | Full route-by-route language and viewport QA required |
| Accessibility and motion | Semantic controls, focus styles and reduced-motion rules | Partial | Full keyboard and assistive-technology review required |

## Production release gate

Do not mark the marketplace production-certified from source checks alone. Verify the live PHP/MySQL environment with authorized customer, supplier and administrator accounts; confirm tenant isolation, file permissions, payment-provider callbacks, AI quota enforcement and real RunPod output before release.
