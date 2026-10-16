# Worker Integration Test

1. Start the common backend from `../backend`.
2. Create the demo worker with `npm run seed:demo`.
3. Start the Worker Flutter app with `--dart-define=API_BASE_URL=http://10.0.2.2:3001`.
4. Login with `EMP-1001 / Worker@123`.
5. Confirm assigned complaints appear in the Worker task list.
6. Accept → On the Way → Arrived → In Progress.
7. Capture completion proof within 100m of the complaint location.
8. Confirm the complaint becomes `WORKER_COMPLETED` and the assignment becomes `VERIFICATION`.
9. Approve from the Officer dashboard and confirm assignment becomes `COMPLETED` and complaint becomes `RESOLVED`.
