class WorkerDepartment {
  final String id;
  final String name;

  const WorkerDepartment({required this.id, required this.name});

  factory WorkerDepartment.fromJson(Map<String, dynamic> json) {
    return WorkerDepartment(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}