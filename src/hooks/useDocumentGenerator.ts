import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { id as indonesian } from 'date-fns/locale';

interface DocumentData {
  leaveApplicationId: string;
  documentType: 'application_letter' | 'decision_letter';
}

export const useDocumentGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processTemplate = (template: string, data: Record<string, any>): string => {
    let processed = template;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, data[key] || '-');
    });
    return processed;
  };

  const generateDocument = async ({ leaveApplicationId, documentType }: DocumentData) => {
    setGenerating(true);
    setError(null);

    try {
      // Fetch leave application with all related data
      const { data: application, error: appError } = await supabase
        .from('leave_applications' as any)
        .select(`
          *,
          profile:profiles!leave_applications_user_id_fkey(
            full_name,
            nip,
            position,
            rank,
            unit_id
          ),
          leave_type:leave_types(name),
          approvals:leave_approvals(
            approver_id,
            status,
            approved_at
          )
        `)
        .eq('id', leaveApplicationId)
        .single();

      if (appError) throw appError;

      const app = application as any;

      // Fetch unit name
      const { data: unit } = await supabase
        .from('units')
        .select('name, head_name, head_nip')
        .eq('id', app.profile.unit_id)
        .single();

      // Fetch appropriate template
      const templateType = documentType === 'application_letter' ? 'leave_application' : 'leave_decision';
      const { data: template, error: templateError } = await supabase
        .from('document_templates' as any)
        .select('*')
        .eq('type', templateType)
        .eq('is_active', true)
        .single();

      if (templateError) throw templateError;

      const tmpl = template as any;

      // Prepare template data
      const templateData = {
        full_name: app.profile.full_name,
        nip: app.profile.nip,
        position: app.profile.position,
        rank: app.profile.rank,
        unit_name: unit?.name || '-',
        leave_type: app.leave_type.name,
        leave_type_upper: app.leave_type.name.toUpperCase(),
        total_days: app.total_days,
        start_date: format(new Date(app.start_date), 'dd MMMM yyyy', { locale: indonesian }),
        end_date: format(new Date(app.end_date), 'dd MMMM yyyy', { locale: indonesian }),
        reason: app.reason,
        city: 'Jakarta', // You can make this configurable
        application_date: format(new Date(app.created_at), 'dd MMMM yyyy', { locale: indonesian }),
        decision_date: format(new Date(), 'dd MMMM yyyy', { locale: indonesian }),
        decision_number: `SK/${format(new Date(), 'yyyy/MM')}/CUTI/${app.id.substring(0, 8).toUpperCase()}`,
        approver_name: unit?.head_name || '-',
        approver_nip: unit?.head_nip || '-',
      };

      // Process template
      const processedContent = processTemplate(tmpl.template_content, templateData);

      // Save to generated_documents
      const { data: generatedDoc, error: saveError } = await supabase
        .from('generated_documents' as any)
        .insert({
          leave_application_id: leaveApplicationId,
          document_type: documentType,
          generated_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      const doc = generatedDoc as any;

      setGenerating(false);
      return { content: processedContent, id: doc.id };
    } catch (err: any) {
      setError(err.message);
      setGenerating(false);
      throw err;
    }
  };

  return { generateDocument, generating, error };
};
