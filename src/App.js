import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import './App.css';

const App = () => {
  const [data, setData] = useState([]);
  const [selectedTweets, setSelectedTweets] = useState([]);
  const [colorMode, setColorMode] = useState('sentiment');

  const width = 800;
  const height = 600;
  const padding = 20; 

  const sentimentColorScale = d3.scaleLinear().domain([-1, 0, 1]).range(["red", "#ECECEC", "green"]);
  const subjectivityColorScale = d3.scaleLinear().domain([0, 1]).range(["#ECECEC", "#4467C4"]);

  useEffect(() => {
    if (data.length === 0) return;

    const svg = d3.select('#visualization');
    const colorScale = colorMode === 'sentiment' ? sentimentColorScale : subjectivityColorScale;

    svg.selectAll('*').remove();

    const forceSimulation = d3.forceSimulation(data)
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1))
      .force('collision', d3.forceCollide(10))
      .stop();

    for (let i = 0; i < 300; i++) {
      forceSimulation.tick();
      data.forEach(d => {
        d.x = Math.max(padding, Math.min(width - padding, d.x));
        d.y = Math.max(padding, Math.min(height - padding, d.y));
      });
    }

    const circles = svg.selectAll('circle').data(data, d => d.idx);

    circles.enter()
      .append('circle')
      .attr('r', 8)
      .attr('stroke', 'none')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .style('fill', d => colorScale(d[colorMode]))
      .on('click', function (event, d) {
        setSelectedTweets(prev => {
          const alreadySelected = prev.find(tweet => tweet.idx === d.idx);
          return alreadySelected ? prev.filter(tweet => tweet.idx !== d.idx) : [d, ...prev];
        });

        d3.select(this)
          .attr('stroke', selectedTweets.find(tweet => tweet.idx === d.idx) ? 'none' : 'black')
          .attr('stroke-width', 2);
      });

    circles.exit().remove();
  }, [data, colorMode]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const loadedData = JSON.parse(e.target.result).map(d => ({
        idx: d.Idx,
        month: +d.Month,
        sentiment: +d.Sentiment,
        subjectivity: +d.Subjectivity,
        rawTweet: d.RawTweet,
        x: 0,
        y: 0,
      }));
      setData(loadedData);
    };
    reader.readAsText(file);
  };

  return (
    <div className="App">
      <h1>Twitter Sentiment Dashboard</h1>
      <input type="file" onChange={handleFileChange} accept=".json" />
      <select value={colorMode} onChange={(e) => setColorMode(e.target.value)}>
        <option value="sentiment">Sentiment</option>
        <option value="subjectivity">Subjectivity</option>
      </select>
      <svg id="visualization" width={width} height={height} style={{ border: '1px solid black' }}></svg>
      <div className="selected-tweets">
        {selectedTweets.map((tweet, index) => (
          <div key={index}>{tweet.rawTweet}</div>
        ))}
      </div>
    </div>
  );
};

export default App;
