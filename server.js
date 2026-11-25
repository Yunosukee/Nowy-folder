const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// SPA routing - serve index.html for all non-API routes
app.get(/^(?!\/api\/).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// In-memory storage for lotteries
const lotteries = new Map();

// Generate unique lottery ID
function generateLotteryId() {
  return uuidv4().split('-')[0];
}

// Gift assignment logic with blacklist
function assignGifts(participants, blacklist) {
  const n = participants.length;
  
  // Try to find valid assignment
  for (let attempts = 0; attempts < 1000; attempts++) {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    let valid = true;
    
    for (let i = 0; i < n; i++) {
      const giver = participants[i];
      const receiver = shuffled[i];
      
      // Check if same person or blacklisted
      if (giver === receiver) {
        valid = false;
        break;
      }
      
      const key = `${giver}→${receiver}`;
      const reverseKey = `${receiver}→${giver}`;
      
      if (blacklist.includes(key) || blacklist.includes(reverseKey)) {
        valid = false;
        break;
      }
    }
    
    if (valid) {
      const result = {};
      for (let i = 0; i < n; i++) {
        result[participants[i]] = shuffled[i];
      }
      return result;
    }
  }
  
  throw new Error('No valid gift assignment found. Check your blacklist.');
}

// POST: Create new lottery
app.post('/api/lottery', (req, res) => {
  const { participants, blacklist = [] } = req.body;
  
  if (!participants || !Array.isArray(participants) || participants.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 participants' });
  }
  
  const lotteryId = generateLotteryId();
  
  try {
    const assignments = assignGifts(participants, blacklist);
    
    lotteries.set(lotteryId, {
      participants,
      blacklist,
      assignments,
      revealed: new Set(),
      createdAt: new Date()
    });
    
    res.json({ 
      lotteryId,
      link: `${req.protocol}://${req.get('host')}/lottery/${lotteryId}`
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET: Lottery page info
app.get('/api/lottery/:id', (req, res) => {
  const lottery = lotteries.get(req.params.id);
  
  if (!lottery) {
    return res.status(404).json({ error: 'Lottery not found' });
  }
  
  res.json({
    participants: lottery.participants,
    revealedCount: lottery.revealed.size,
    totalCount: lottery.participants.length
  });
});

// POST: Reveal gift for participant
app.post('/api/lottery/:id/reveal', (req, res) => {
  const { participant } = req.body;
  const lottery = lotteries.get(req.params.id);
  
  if (!lottery) {
    return res.status(404).json({ error: 'Lottery not found' });
  }
  
  if (!lottery.participants.includes(participant)) {
    return res.status(400).json({ error: 'Invalid participant' });
  }
  
  if (lottery.revealed.has(participant)) {
    return res.status(400).json({ error: 'Already revealed' });
  }
  
  lottery.revealed.add(participant);
  const receiver = lottery.assignments[participant];
  
  res.json({ 
    giver: participant,
    receiver,
    remaining: lottery.participants.length - lottery.revealed.size
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎁 Lottery server running on http://localhost:${PORT}`);
});
