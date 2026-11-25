const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();

// UTF-8 encoding middleware
app.use((req, res, next) => {
  res.charset = 'utf-8';
  next();
});

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// SPA routing - serve index.html for all non-API routes
app.get(/^(?!\/api\/).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// File-based storage
const LOTTERIES_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(LOTTERIES_DIR)) {
  fs.mkdirSync(LOTTERIES_DIR);
}

function getLotteryPath(lotteryId) {
  return path.join(LOTTERIES_DIR, `${lotteryId}.json`);
}

function saveLottery(lotteryId, data) {
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(getLotteryPath(lotteryId), json, 'utf8');
}

function loadLottery(lotteryId) {
  const filePath = getLotteryPath(lotteryId);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }
  return null;
}

// In-memory lotteries list (for discovery)
const lotteries = new Map();

// Generate unique lottery ID
function generateLotteryId() {
  return uuidv4().split('-')[0];
}

// Generate secure token for participant
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Gift assignment logic with blacklist
function assignGifts(participants, blacklist) {
  const n = participants.length;
  
  // Normalize blacklist to pipe format
  const normalizedBlacklist = blacklist.map(item => {
    return item.replace(/→|->|—/g, '|');
  });
  
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
      
      const key = `${giver}|${receiver}`;
      const reverseKey = `${receiver}|${giver}`;
      
      if (normalizedBlacklist.includes(key) || normalizedBlacklist.includes(reverseKey)) {
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
  const adminToken = generateToken();
  
  try {
    const assignments = assignGifts(participants, blacklist);
    
    // Create participant entries with individual tokens
    const participantMap = {};
    participants.forEach(name => {
      participantMap[name] = {
        token: generateToken(),
        revealed: false,
        revealedAt: null
      };
    });
    
    // Normalize blacklist to use pipe separator instead of arrow
    const normalizedBlacklist = blacklist.map(item => {
      return item.replace(/→|->|->|—/g, '|');
    });
    
    const lotteryData = {
      id: lotteryId,
      adminToken,
      participants,
      participantMap,
      blacklist: normalizedBlacklist,
      assignments,
      createdAt: new Date().toISOString(),
      results: []
    };
    
    saveLottery(lotteryId, lotteryData);
    lotteries.set(lotteryId, {
      participants,
      blacklist,
      createdAt: new Date()
    });
    
    res.json({ 
      lotteryId,
      adminToken,
      adminLink: `${req.protocol}://${req.get('host')}/admin/${lotteryId}?token=${adminToken}`,
      participantLinks: participants.map(name => ({
        name,
        link: `${req.protocol}://${req.get('host')}/reveal?lotteryId=${lotteryId}&token=${participantMap[name].token}`
      }))
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET: Admin panel info
app.get('/api/lottery/:id/admin', (req, res) => {
  const { token } = req.query;
  const lottery = loadLottery(req.params.id);
  
  if (!lottery) {
    return res.status(404).json({ error: 'Lottery not found' });
  }
  
  if (lottery.adminToken !== token) {
    return res.status(403).json({ error: 'Invalid admin token' });
  }
  
  const results = lottery.participants.map(participant => {
    const info = lottery.participantMap[participant];
    return {
      name: participant,
      receiver: lottery.assignments[participant],
      revealed: info.revealed,
      revealedAt: info.revealedAt
    };
  });
  
  res.json({
    id: lottery.id,
    participants: lottery.participants,
    blacklist: lottery.blacklist,
    createdAt: lottery.createdAt,
    results,
    participantLinks: lottery.participants.map(name => ({
      name,
      link: `${req.protocol}://${req.get('host')}/reveal?lotteryId=${lottery.id}&token=${lottery.participantMap[name].token}`
    }))
  });
});

// POST: Reveal gift for participant (with token)
app.post('/api/lottery/:id/reveal', (req, res) => {
  const { token } = req.body;
  const lottery = loadLottery(req.params.id);
  
  if (!lottery) {
    return res.status(404).json({ error: 'Lottery not found' });
  }
  
  // Find participant by token
  let participant = null;
  for (const [name, info] of Object.entries(lottery.participantMap)) {
    if (info.token === token) {
      participant = name;
      break;
    }
  }
  
  if (!participant) {
    return res.status(400).json({ error: 'Invalid token' });
  }
  
  if (lottery.participantMap[participant].revealed) {
    return res.status(400).json({ error: 'Already revealed' });
  }
  
  lottery.participantMap[participant].revealed = true;
  lottery.participantMap[participant].revealedAt = new Date().toISOString();
  
  const receiver = lottery.assignments[participant];
  const remaining = lottery.participants.filter(p => !lottery.participantMap[p].revealed).length;
  
  lottery.results.push({
    giver: participant,
    receiver,
    revealedAt: new Date().toISOString()
  });
  
  saveLottery(req.params.id, lottery);
  
  res.json({ 
    giver: participant,
    receiver,
    remaining
  });
});

// GET: Participant reveal info (read-only before revealing)
app.get('/api/lottery/:id/participant/:token', (req, res) => {
  const lottery = loadLottery(req.params.id);
  
  if (!lottery) {
    return res.status(404).json({ error: 'Lottery not found' });
  }
  
  // Find participant by token
  let participant = null;
  for (const [name, info] of Object.entries(lottery.participantMap)) {
    if (info.token === req.params.token) {
      participant = name;
      break;
    }
  }
  
  if (!participant) {
    return res.status(400).json({ error: 'Invalid token' });
  }
  
  const info = lottery.participantMap[participant];
  
  res.json({
    name: participant,
    already_revealed: info.revealed,
    receiver: info.revealed ? lottery.assignments[participant] : null,
    totalParticipants: lottery.participants.length,
    participantsRevealed: lottery.participants.filter(p => lottery.participantMap[p].revealed).length
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎁 Lottery server running on http://localhost:${PORT}`);
});
