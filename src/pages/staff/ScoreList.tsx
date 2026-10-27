import { Link } from 'react-router-dom';
import { isAdmin } from '@domain';
import { useStaff } from '../../state/live';
import { useAuth } from '../../state/auth';
import { EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from '../../components/ui';

export default function ScoreList() {
  const { data, error, refresh } = useStaff();
  const { user } = useAuth();
  if (!data || !user) return error ? <ErrorState message={error} onRetry={refresh} /> : <Loading />;
  const admin = isAdmin(user.role);
  const list = data.competitions.filter((c) => {
    const a = data.assignments.find((x) => x.competitionId === c.id);
    return admin || a?.scorerId === user.id || a?.judgeIds.includes(user.id);
  });
  return (
    <>
      <PageHeader title="บันทึกคะแนน" subtitle={admin ? 'ผู้ดูแลเห็นทุกรายการ' : 'รายการที่คุณได้รับมอบหมาย'} />
      {list.length === 0 ? <EmptyState title="ยังไม่ได้รับมอบหมายรายการใด">ติดต่อผู้ดูแลระบบเพื่อมอบหมายรายการที่คุณรับผิดชอบ</EmptyState> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const a = data.assignments.find((x) => x.competitionId === c.id);
            const role = a?.scorerId === user.id ? 'ผู้บันทึกหลัก' : a?.judgeIds.includes(user.id) ? 'กรรมการ' : 'ผู้ดูแล';
            return (
              <Link key={c.id} to={`/staff/score/${c.id}`} className={`card block p-4 transition hover:border-field ${c.status === 'open' ? 'ring-2 ring-field/30' : ''}`}>
                <div className="flex items-start justify-between gap-2"><h2 className="text-lg font-bold">{c.name}</h2><StatusBadge status={c.status} /></div>
                <p className="mt-1 text-sm text-muted">{c.schedule}</p>
                <p className="mt-2 text-xs font-semibold text-field">{role}</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
