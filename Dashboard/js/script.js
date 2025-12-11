document.addEventListener('DOMContentLoaded', () => {
    // Path to your local JSON file
    const dataPath = 'data/csvjson.json';

    // Fetch the data from the local file
    fetch(dataPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            initializeDashboard(data);
        })
        .catch(error => {
            console.error("Error loading the data:", error);
            alert("Could not load data. Please ensure the file exists at './data/csvjson.json' and you are running this from a local web server.");
        });

    function initializeDashboard(data) {
        // --- NEW: Set default chart colors for dark theme ---
        Chart.defaults.color = '#e2e8f0'; // Sets default text color for legends, labels, etc.
        Chart.defaults.borderColor = '#4a5568'; // Sets default color for grid lines

        // --- KPI Calculation ---
        const totalPosts = data.length;
        const misinfoPosts = data.filter(p => p.Misinformation_Flag === 'True').length;
        const misinfoRate = (misinfoPosts / totalPosts) * 100;
        const totalEngagementScore = data.reduce((sum, p) => sum + p.Engagement_Score, 0);
        const avgEngagement = totalEngagementScore / totalPosts;
        const totalInteractions = data.reduce((sum, p) => sum + p.Like_Count + p.Share_Count + p.Comment_Count, 0);

        // Update KPIs in the HTML
        document.getElementById('total-posts').textContent = totalPosts;
        document.getElementById('misinfo-rate').textContent = `${misinfoRate.toFixed(1)}%`;
        document.getElementById('avg-engagement').textContent = avgEngagement.toFixed(2);
        document.getElementById('total-interactions').textContent = (totalInteractions / 1000).toFixed(1) + 'k';

        // --- Chart Data Preparation ---
        const getCounts = (key) => data.reduce((acc, post) => {
            acc[post[key]] = (acc[post[key]] || 0) + 1;
            return acc;
        }, {});

        const platformCounts = getCounts('Platform');
        const moderationCounts = getCounts('Moderation_Action');
        const politicalLeaningCounts = getCounts('Political_Leaning');
        const misinfoByCategory = data.reduce((acc, post) => {
            if (post.Misinformation_Flag === 'True') {
                acc[post.Content_Category] = (acc[post.Content_Category] || 0) + 1;
            }
            return acc;
        }, {});

        // --- Chart Rendering ---
        const createChart = (ctx, type, labels, chartData, label, colors) => {
            new Chart(ctx, {
                type: type,
                data: {
                    labels: labels,
                    datasets: [{
                        label: label,
                        data: chartData,
                        backgroundColor: colors,
                        borderColor: '#2d3748', // Match card background for doughnut/pie borders
                        borderWidth: type === 'bar' ? 0 : 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: type === 'bar' ? 'top' : 'right',
                            display: type !== 'bar',
                        }
                    },
                    scales: type === 'bar' ? { 
                        y: { 
                            beginAtZero: true,
                            grid: { color: '#4a5568' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    } : {}
                }
            });
        };

        const chartColors = ['#63b3ed', '#f56565', '#48bb78', '#f6ad55', '#b794f4', '#f6e05e', '#f56565', '#a0aec0'];

        createChart(document.getElementById('platformChart').getContext('2d'), 'doughnut', Object.keys(platformCounts), Object.values(platformCounts), 'Posts by Platform', chartColors);
        createChart(document.getElementById('misinfoCategoryChart').getContext('2d'), 'bar', Object.keys(misinfoByCategory), Object.values(misinfoByCategory), '# of Misinformation Posts', chartColors.slice(1));
        createChart(document.getElementById('moderationChart').getContext('2d'), 'bar', Object.keys(moderationCounts), Object.values(moderationCounts), 'Moderation Actions', chartColors);
        createChart(document.getElementById('politicalLeaningChart').getContext('2d'), 'pie', Object.keys(politicalLeaningCounts), Object.values(politicalLeaningCounts), 'Political Leaning', chartColors);

        // --- Table Rendering ---
        const tableBody = document.getElementById('table-body');
        const renderTable = (dataToRender) => {
            tableBody.innerHTML = '';
            dataToRender.forEach(post => {
                const sentimentClass = post.Sentiment_Score > 0.2 ? 'sentiment-positive' : post.Sentiment_Score < -0.2 ? 'sentiment-negative' : 'sentiment-neutral';
                const toxicityClass = post.Toxicity_Score > 0.7 ? 'toxicity-high' : post.Toxicity_Score > 0.4 ? 'toxicity-medium' : '';

                const row = `
                    <tr class="${toxicityClass}">
                        <td>${post.Platform}</td>
                        <td><div class="content-text" title="${post.Content_Text}">${post.Content_Text}</div></td>
                        <td>${post.Content_Category}</td>
                        <td class="misinformation-${String(post.Misinformation_Flag).toLowerCase()}">${post.Misinformation_Flag}</td>
                        <td>${post.Engagement_Score.toFixed(2)}</td>
                        <td>${post.Toxicity_Score.toFixed(2)}</td>
                        <td class="${sentimentClass}">${post.Sentiment_Score.toFixed(2)}</td>
                        <td>${post.Political_Leaning}</td>
                        <td>${post.Moderation_Action}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        };
        renderTable(data);

        // --- Search Functionality ---
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredData = data.filter(post =>
                post.Content_Text.toLowerCase().includes(searchTerm) ||
                post.Platform.toLowerCase().includes(searchTerm) ||
                post.Content_Category.toLowerCase().includes(searchTerm)
            );
            renderTable(filteredData);
        });
    }
});