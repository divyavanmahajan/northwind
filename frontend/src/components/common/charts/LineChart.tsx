import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface LineChartProps {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor?: string;
        backgroundColor?: string;
    }[];
    title?: string;
}

export function LineChart({ labels, datasets, title }: LineChartProps) {
    const data = {
        labels,
        datasets: datasets.map((ds, i) => ({
            ...ds,
            borderColor: ds.borderColor || `hsl(${i * 60}, 70%, 50%)`,
            backgroundColor: ds.backgroundColor || `hsla(${i * 60}, 70%, 50%, 0.1)`,
            tension: 0.3,
            fill: true,
        })),
    };

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: !!title, text: title },
        },
        scales: {
            y: { beginAtZero: true },
        },
    };

    return <Line data={data} options={options} />;
}
