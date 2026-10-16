import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/task_model.dart';
import '../../providers/auth_provider.dart';
import '../../services/worker_api_service.dart';

final workerApiServiceProvider = Provider<WorkerApiService>((ref) => WorkerApiService());

final taskProvider = StateNotifierProvider<TaskNotifier, List<TaskModel>>((ref) {
  return TaskNotifier(ref);
});

class TaskNotifier extends StateNotifier<List<TaskModel>> {
  final Ref _ref;
  TaskNotifier(this._ref) : super(const []);

  WorkerApiService get _api => _ref.read(workerApiServiceProvider);

  Future<void> loadTasks() async {
    final worker = _ref.read(authStateProvider).worker;
    if (worker == null) return;
    try {
      state = await _api.getWorkerTasks(worker.id);
    } catch (e) {
      rethrow;
    }
  }

  TaskModel? getTask(String taskId) {
    for (final task in state) {
      if (task.id == taskId) return task;
    }
    return null;
  }

  Future<bool> updateStatus(String taskId, TaskStatus newStatus) async {
    final worker = _ref.read(authStateProvider).worker;
    if (worker == null) return false;
    try {
      final updated = await _api.updateTaskStatus(taskId, worker.id, newStatus);
      _replace(updated);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> acceptTask(String taskId) => updateStatus(taskId, TaskStatus.accepted);
  Future<bool> rejectTask(String taskId) => updateStatus(taskId, TaskStatus.rejected);
  Future<bool> onTheWay(String taskId) => updateStatus(taskId, TaskStatus.onTheWay);
  Future<bool> arrived(String taskId) => updateStatus(taskId, TaskStatus.arrived);
  Future<bool> startRepair(String taskId) => updateStatus(taskId, TaskStatus.inProgress);
  Future<bool> markResolved(String taskId) => updateStatus(taskId, TaskStatus.resolved);
  Future<bool> startVerification(String taskId) => updateStatus(taskId, TaskStatus.verification);
  Future<bool> completeTask(String taskId) => updateStatus(taskId, TaskStatus.completed);

  void _replace(TaskModel task) {
    state = [
      for (final item in state)
        if (item.id == task.id) ...[task] else ...[item],
    ];
    if (!state.any((item) => item.id == task.id)) state = [...state, task];
  }
}
