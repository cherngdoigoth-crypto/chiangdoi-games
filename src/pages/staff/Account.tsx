import { ROLE_LABEL } from '@domain';
import { useAuth } from '../../state/auth';
import { PageHeader } from '../../components/ui';
import { PasswordForm } from '../Login';

export default function Account() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="บัญชีของฉัน" />
      <div className="card mb-4 p-5 text-sm">
        <div className="grid grid-cols-[8rem_1fr] gap-y-2">
          <span className="text-muted">ชื่อที่แสดง</span><span className="font-semibold">{user.displayName}</span>
          <span className="text-muted">ชื่อผู้ใช้</span><span>{user.username}</span>
          <span className="text-muted">บทบาท</span><span>{ROLE_LABEL[user.role]}</span>
        </div>
      </div>
      <div className="card p-5"><h2 className="mb-4 text-lg font-bold">เปลี่ยนรหัสผ่าน</h2><PasswordForm /></div>
    </div>
  );
}
