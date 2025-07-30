import { useEffect, useState } from "react";
import axios from "axios";

export const OccupancyTrend = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // שליפת הנתונים מהשרת
    const fetchTrends = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/occupancy/getAllTrends`);
        setTrends(response.data || []);
      } catch (error) {
        console.error("Failed to fetch trends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  return (
    <div className="occupancyTrend">
      <h1>Occupancy Trend</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table border={1} style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Room</th>
              <th>Customer</th>
              <th>Occupancy Rate</th>
              <th>Total Space</th>
              <th>Occupied</th>
              <th>Average</th>
              <th>Peak</th>
              <th>Low</th>
              <th>Growth</th>
              <th>Workspace Type</th>
              <th>Status</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend: any) => (
              <tr key={trend.id}>
                <td>{trend.id}</td>
                <td>{trend.date}</td>
                <td>{trend.roomId}</td>
                <td>{trend.customerId}</td>
                <td>{trend.occupancyRate}</td>
                <td>{trend.totalSpace}</td>
                <td>{trend.occupiedSpaces}</td>
                <td>{trend.averageOccupancy}</td>
                <td>{trend.peakOccupancy}</td>
                <td>{trend.lowOccupancy}</td>
                <td>{trend.growthRate}</td>
                <td>{trend.workspaceType}</td>
                <td>{trend.type}</td>
                <td>{trend.isActive ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
