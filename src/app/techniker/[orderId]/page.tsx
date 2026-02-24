import { redirect } from "next/navigation";

export default async function TechnikerDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  redirect(`/orders/${orderId}?tab=tech`);
}
