import dynamic from "next/dynamic";
const AdminClient = dynamic(() =>
  import("./admin-client").then((md) => md.AdminClient)
);

// will be only if .env have require vars for admn sdk.
// const getStats = async () => {
//   const usersCount = (await adminDb.collection("users").count().get()).data()
//     .count;
//   const quizzesCount = (await adminDb.collection("quiz").count().get()).data()
//     .count;
//   const reportsCount = (
//     await adminDb.collection("reports").count().get()
//   ).data().count;

//   return { usersCount, quizzesCount, reportsCount } as const;
// };

// Data will be streamed to client
export default function Page() {
  // const statsPromise = getStats();

  return <AdminClient />;
  // return <AdminClient statsPromise={statsPromise} />;
}
