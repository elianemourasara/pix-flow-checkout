
import React from 'react';
import { useDashboardData } from '@/hooks/admin/useDashboardData';
import DashboardHeader from '@/components/admin/dashboard/DashboardHeader';
import DashboardStats from '@/components/admin/dashboard/DashboardStats';
import OrdersTimeChart from '@/components/admin/dashboard/OrdersTimeChart';
import PaymentMethodsChart from '@/components/admin/dashboard/PaymentMethodsChart';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';
import OrderStatusChart from '@/components/admin/dashboard/OrderStatusChart';
import ActiveVisitorsCard from '@/components/admin/dashboard/ActiveVisitorsCard';

const DashboardPage = () => {
  const {
    period,
    setPeriod,
    stats,
    statsLoading,
    ordersOverTime,
    paymentDistribution,
    statusDistribution
  } = useDashboardData();
  
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <DashboardHeader 
        period={period}
        setPeriod={setPeriod}
      />
      
      <DashboardStats 
        stats={stats}
        loading={statsLoading}
        period={period}
      />
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ActiveVisitorsCard />
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <OrdersTimeChart data={ordersOverTime} />
        <PaymentMethodsChart data={paymentDistribution} />
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RevenueChart data={ordersOverTime} />
        <OrderStatusChart data={statusDistribution} />
      </div>
    </div>
  );
};

export default DashboardPage;
