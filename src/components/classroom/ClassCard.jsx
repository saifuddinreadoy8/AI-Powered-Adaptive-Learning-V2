import Link from 'next/link';

export default function ClassCard({ cls, role = 'teacher' }) {
  const studentCount = cls.enrollments?.[0]?.count || 0;
  const href = role === 'teacher' ? `/teacher/classes/${cls.id}` : `/student/classes/${cls.id}`;

  return (
    <Link href={href} className="card-hover block">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-xl">
            🏫
          </div>
          <div>
            <h3 className="font-bold text-white">{cls.class_name}</h3>
            <p className="text-slate-400 text-sm">
              Code: <b className="text-indigo-400">{cls.class_code}</b>
              {role === 'teacher' && ` • Password: ${cls.class_password}`}
            </p>
            {cls.description && <p className="text-slate-500 text-xs mt-0.5">{cls.description}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-400">{studentCount}</p>
          <p className="text-xs text-slate-500">students</p>
        </div>
      </div>
    </Link>
  );
}
