import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/complaint_model.dart';
import '../../repositories/complaint_repository.dart';
import '../../services/api/api_client.dart';
import '../routes/app_routes.dart';
import '../theme/app_colors.dart';
import '../widgets/citizen_shell.dart';

class ComplaintDetailsScreen extends StatefulWidget{final String complaintId;const ComplaintDetailsScreen({super.key,required this.complaintId});@override State<ComplaintDetailsScreen> createState()=>_ComplaintDetailsScreenState();}
class _ComplaintDetailsScreenState extends State<ComplaintDetailsScreen>{ComplaintModel? c;bool loading=true;String? error;@override void initState(){super.initState();_load();}Future<void> _load()async{try{c=await RealComplaintRepository(ApiClient()).getComplaintById(widget.complaintId);}catch(e){error=e.toString();}if(mounted)setState(()=>loading=false);}
 @override Widget build(BuildContext context)=>CitizenShell(index:1,title:'Complaint Tracking',showBack:true,onRefresh:_load,child:loading?const Center(child:CircularProgressIndicator()):error!=null?Center(child:Padding(padding:const EdgeInsets.all(20),child:Text(error!))):_body(c!));
 Widget _body(ComplaintModel c)=>ListView(padding:const EdgeInsets.fromLTRB(16,8,16,30),children:[
  Row(children:[const Text('GRIEVANCE TRACKING',style:TextStyle(fontSize:9,fontWeight:FontWeight.w900,color:Color(0xFF1769FF))),const Spacer(),_tag(_status(c.status),const Color(0xFF4A8DEB))]),
  const SizedBox(height:12),
  Row(children:[const Icon(Icons.construction_rounded,size:18,color:Color(0xFF24304A)),const SizedBox(width:6),Text(c.id,style:const TextStyle(fontSize:10,color:AppColors.textTertiary,fontWeight:FontWeight.w700)),const Spacer(),_tag(c.priority.name.toUpperCase(),const Color(0xFFF3B64C))]),
  const SizedBox(height:8),Text(_cat(c.category),style:const TextStyle(fontSize:20,fontWeight:FontWeight.w900)),const SizedBox(height:8),Text(c.description,style:const TextStyle(fontSize:11,color:AppColors.textSecondary,height:1.45)),const SizedBox(height:12),
  if(c.imageUrl.isNotEmpty)ClipRRect(borderRadius:BorderRadius.circular(13),child:CachedNetworkImage(imageUrl:c.imageUrl,height:170,width:double.infinity,fit:BoxFit.cover,errorWidget:(_,__,___)=>Container(height:170,color:const Color(0xFFEFF3F8),child:const Icon(Icons.image_not_supported_outlined)))),
  const SizedBox(height:14),
  _infoCard(c),const SizedBox(height:12),_timeline(c),
  if(c.worker!=null)...[const SizedBox(height:12),_worker(c)],
  if(c.completionProofUrl != null || c.completionNotes != null || c.status == ComplaintStatus.workerCompleted || c.status == ComplaintStatus.resolved)...[
    const SizedBox(height:12),
    _completionProofCard(c),
  ],
  if(c.feedback == null && (c.status == ComplaintStatus.workerCompleted || c.status == ComplaintStatus.resolved))...[
    const SizedBox(height:12),
    SizedBox(height:48,child:ElevatedButton.icon(onPressed:()=>Navigator.pushNamed(context,AppRoutes.feedback,arguments:c.id),icon:const Icon(Icons.star_border_rounded),label:const Text('RATE THE RESOLUTION'))),
  ],
  if(c.feedback != null)...[
    const SizedBox(height:12),
    _existingFeedbackCard(c),
  ],
 ]);
 Widget _infoCard(ComplaintModel c)=>Container(padding:const EdgeInsets.all(12),decoration:BoxDecoration(color:Colors.white,borderRadius:BorderRadius.circular(14),border:Border.all(color:AppColors.cardBorder)),child:Column(children:[_row(Icons.location_on_outlined,'Address',c.address),const Divider(height:20),_row(Icons.gps_fixed_rounded,'Coordinates','${c.latitude.toStringAsFixed(5)}, ${c.longitude.toStringAsFixed(5)}'),const Divider(height:20),_row(Icons.business_outlined,'Department',c.department??'Pending assignment') ]));
 Widget _row(IconData i,String a,String b)=>Row(children:[Icon(i,size:17,color:const Color(0xFF1769FF)),const SizedBox(width:9),Expanded(child:Text(a,style:const TextStyle(fontSize:9,color:AppColors.textTertiary))),Expanded(flex:2,child:Text(b,textAlign:TextAlign.right,style:const TextStyle(fontSize:10,fontWeight:FontWeight.w700)))]);
 Widget _timeline(ComplaintModel c)=>Container(padding:const EdgeInsets.all(14),decoration:BoxDecoration(color:Colors.white,borderRadius:BorderRadius.circular(14),border:Border.all(color:AppColors.cardBorder)),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[const Text('STATUS PROGRESS',style:TextStyle(fontSize:9,fontWeight:FontWeight.w900)),const SizedBox(height:12),..._steps(c.status)]));
 List<Widget> _steps(ComplaintStatus s){final order=[ComplaintStatus.submitted,ComplaintStatus.verified,ComplaintStatus.assigned,ComplaintStatus.inProgress,ComplaintStatus.workerCompleted,ComplaintStatus.resolved];final labels=['Reported','Verified','Assigned','In Progress','Worker Completed','Resolved'];final idx=order.indexOf(s);return List.generate(order.length,(i){final done=i<=idx;return Row(crossAxisAlignment:CrossAxisAlignment.start,children:[Column(children:[CircleAvatar(radius:8,backgroundColor:done?const Color(0xFF18A566):const Color(0xFFE6EBF2),child:done?const Icon(Icons.check,size:10,color:Colors.white):const SizedBox.shrink()),if(i<order.length-1)Container(width:2,height:20,color:done?const Color(0xFF9BE0BF):const Color(0xFFE6EBF2))]),const SizedBox(width:9),Padding(padding:const EdgeInsets.only(top:1),child:Text(labels[i],style:TextStyle(fontSize:10,fontWeight:done?FontWeight.w800:FontWeight.w500,color:done?AppColors.textPrimary:AppColors.textTertiary))) ]);});}
 Widget _worker(ComplaintModel c)=>Container(padding:const EdgeInsets.all(13),decoration:BoxDecoration(color:const Color(0xFF112C66),borderRadius:BorderRadius.circular(14)),child:Row(children:[const CircleAvatar(radius:24,backgroundColor:Colors.white,child:Icon(Icons.person,color:Color(0xFF1769FF))),const SizedBox(width:10),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[const Text('ASSIGNED CIVIC WORKER',style:TextStyle(fontSize:8,color:Colors.white70,fontWeight:FontWeight.w800)),Text(c.worker!.name,style:const TextStyle(color:Colors.white,fontSize:13,fontWeight:FontWeight.w900)),Text(c.worker!.department,style:const TextStyle(color:Colors.white70,fontSize:9)),const SizedBox(height:3),Text(c.worker!.status,style:const TextStyle(color:Colors.white,fontSize:9))]),),IconButton(onPressed:()=>Navigator.pushNamed(context,AppRoutes.liveTracking,arguments:c.id),icon:const Icon(Icons.map_outlined,color:Colors.white))]));
 Widget _completionProofCard(ComplaintModel c) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'WORK COMPLETION PROOF',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'BEFORE',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF9B2C2C),
                      ),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 120,
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: CachedNetworkImage(
                          imageUrl: c.imageUrl,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          errorWidget: (_, __, ___) => Container(
                            color: const Color(0xFFEFF3F8),
                            child: const Icon(Icons.image_not_supported_outlined),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AFTER',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1E7A40),
                      ),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      height: 120,
                      child: c.completionProofUrl != null &&
                              c.completionProofUrl!.isNotEmpty
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: CachedNetworkImage(
                                imageUrl: c.completionProofUrl!,
                                fit: BoxFit.cover,
                                width: double.infinity,
                                placeholder: (_, __) => Container(
                                  color: const Color(0xFFF6F8FB),
                                  alignment: Alignment.center,
                                  child: const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                ),
                                errorWidget: (_, __, ___) => Container(
                                  color: const Color(0xFFEFF3F8),
                                  child: const Icon(
                                    Icons.image_not_supported_outlined,
                                  ),
                                ),
                              ),
                            )
                          : Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFF6F8FB),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              alignment: Alignment.center,
                              child: const Padding(
                                padding: EdgeInsets.all(16),
                                child: Text(
                                  'Waiting for worker completion proof',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (c.completionNotes != null &&
              c.completionNotes!.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            const Text(
              'COMPLETION NOTES',
              style: TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w900,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              c.completionNotes!,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _miniBadge('Status', _status(c.status)),
              if (c.worker != null) _miniBadge('Worker', c.worker!.name),
            ],
          ),
          if (c.completionProofUrl != null &&
              c.completionProofUrl!.isNotEmpty) ...[
            const SizedBox(height: 10),
            const Text(
              'Completion photo uploaded by the assigned worker',
              style: TextStyle(
                fontSize: 9,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ],
      ),
    );
  }
 Widget _existingFeedbackCard(ComplaintModel c)=>Container(padding:const EdgeInsets.all(12),decoration:BoxDecoration(color:Colors.white,borderRadius:BorderRadius.circular(14),border:Border.all(color:AppColors.cardBorder)),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[const Text('YOUR RATING',style:TextStyle(fontSize:10,fontWeight:FontWeight.w900,color:AppColors.textPrimary)),const SizedBox(height:8),Row(children:[...List.generate(5,(i)=>Icon(i < (c.feedback?.rating ?? 0) ? Icons.star_rounded : Icons.star_border_rounded,size:20,color:i < (c.feedback?.rating ?? 0) ? const Color(0xFFF5B63D) : AppColors.textTertiary)),const SizedBox(width:8),Text('${c.feedback?.rating ?? 0}/5',style:const TextStyle(fontSize:12,fontWeight:FontWeight.w900))]),const SizedBox(height:12),const Text('YOUR FEEDBACK',style:TextStyle(fontSize:10,fontWeight:FontWeight.w900,color:AppColors.textPrimary)),const SizedBox(height:5),Text(c.feedback?.comment?.trim().isNotEmpty == true ? c.feedback!.comment! : 'No additional comments provided.',style:const TextStyle(fontSize:10,color:AppColors.textSecondary,height:1.45)),if(c.feedback != null)...[const SizedBox(height:10),Text('Submitted on: ${c.feedback!.createdAt.toLocal().toString()}',style:const TextStyle(fontSize:9,color:AppColors.textTertiary))]]));
 Widget _miniBadge(String label,String value)=>Expanded(child:Container(padding:const EdgeInsets.symmetric(horizontal:8,vertical:6),decoration:BoxDecoration(color:const Color(0xFFF7F9FC),borderRadius:BorderRadius.circular(8)),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Text(label,style:const TextStyle(fontSize:7,color:AppColors.textTertiary,fontWeight:FontWeight.w800)),const SizedBox(height:3),Text(value,style:const TextStyle(fontSize:9,fontWeight:FontWeight.w700,color:AppColors.textPrimary))])));
 Widget _tag(String t,Color c)=>Container(padding:const EdgeInsets.symmetric(horizontal:7,vertical:3),decoration:BoxDecoration(color:c.withValues(alpha:.14),borderRadius:BorderRadius.circular(5)),child:Text(t,style:TextStyle(fontSize:7,fontWeight:FontWeight.w900,color:c)));String _cat(IssueCategory c)=>c.name.replaceAll('_',' ').toUpperCase();String _status(ComplaintStatus s)=>s==ComplaintStatus.inProgress?'IN PROGRESS':s==ComplaintStatus.workerCompleted?'WORK COMPLETED':s.name.replaceAll('_',' ').toUpperCase();
}
