import { Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
    labels: string[];
    data: number[];
    colors?: string[];
    title?: string;
    type?: 'pie' | 'doughnut';
}

export function PieChart({ labels, data, colors, title, type = 'doughnut' }: PieChartProps) {
    const chartData = {
        labels,
        datasets: [{
            data,
            backgroundColor: colors || [
                'hsl(210, 70%, 50%)',
                'hsl(160, 70%, 50%)',
                'hsl(40, 70%, 50%)',
                'hsl(0, 70%, 50%)',
                'hsl(280, 70%, 50%)',
            ],
        }],
    };

    const options: ChartOptions<'pie' | 'doughnut'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: !!title, text: title },
        },
    };

    const ChartComponent = type === 'pie' ? Pie : Doughnut;

    return <ChartComponent data={chartData} options={options} />;
}
