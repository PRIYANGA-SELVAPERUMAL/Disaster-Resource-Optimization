# 🌪️ Decision-Oriented Multi-Modal Framework for Disaster Risk Assessment and Resource Optimization

An end-to-end AI-driven disaster response framework that fuses satellite imagery, social media intelligence, graph neural networks, and reinforcement learning to optimize emergency resource allocation and maximize lives saved.

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Datasets](#-datasets)
- [Problem Statement](#-problem-statement)
- [Methodology](#-methodology)
- [Model Architecture](#-model-architecture)
- [Model Performance](#-model-performance)
- [ARTEMIS Dashboard](#-artemis-dashboard)
- [Tech Stack](#-tech-stack)
- [How to Run the Project](#-how-to-run-the-project)
- [Ablation Study](#-ablation-study)
- [Future Enhancements](#-future-enhancements)

---

## 📖 About the Project

Natural disasters — floods, hurricanes, earthquakes, wildfires — cause devastating human and infrastructural losses every year. Effective disaster response demands **rapid situational awareness** and **optimal allocation of limited resources** under extreme uncertainty.

Traditional systems fall short because they:

- Rely on static risk assessments or isolated data sources
- Cannot capture evolving disaster severity or spatial dependencies
- Ignore infrastructure capacity limitations and transport logistics
- Treat damage assessment and resource allocation as disconnected problems

This framework proposes an **integrated multi-modal disaster intelligence pipeline** that:

✔ Estimates physical damage severity from **satellite imagery** (xView2 dataset)  
✔ Captures human urgency and impact from **social media** (HumAID dataset)  
✔ Fuses both sources into a **confidence-aware unified risk score**  
✔ Refines spatial risk using a **Graph Convolutional Network (GCN)**  
✔ Optimizes resource allocation via **Proximal Policy Optimization (PPO)** reinforcement learning  
✔ Provides real-time decision support via the **ARTEMIS simulation dashboard**

The goal: transparent, adaptive, and life-saving disaster response planning powered by AI.

---

## 📊 Datasets

This framework integrates four heterogeneous data sources:

**1. Satellite Disaster Damage Dataset — xView2**
- ~850,736 annotated buildings from real-world disaster events
- Disaster types: Earthquakes, floods, hurricanes, wildfires, volcanic events
- Damage categories: No Damage, Minor, Major, Destroyed
- Format: High-resolution pre/post-disaster RGB satellite imagery
- 🔗 [xView2 Dataset](https://xview2.org/dataset)

**2. Social Media Disaster Dataset — HumAID**
- ~77,000 disaster-related tweets spanning 2016–2019
- Covers floods, earthquakes, hurricanes, wildfires
- Annotation categories: Injuries, displacement, infrastructure damage, urgent needs
- 🔗 [HumAID Dataset](https://huggingface.co/datasets/QCRI/HumAID-all)

**3. Population Exposure Dataset — WorldPop 2020**
- Gridded global population at ~1 km spatial resolution
- GeoTIFF georeferenced raster format
- ~800 persons per grid point estimation rule
- 🔗 [WorldPop Dataset](https://hub.worldpop.org/doi/10.5258/SOTON/WP00674)

**4. Generated Disaster Resource Database**
- Synthetically constructed across 8 disaster zones (flood + wind)
- Resources: Ambulances, buses, flood boats, hospitals (bed-capacity constrained), shelters
- Grounded in population exposure and risk-proportional infrastructure heuristics

---

## ❓ Problem Statement

To develop an end-to-end, data-driven disaster intelligence framework capable of:

1️⃣ Fusing satellite imagery + social media to estimate disaster severity  
2️⃣ Modeling spatial risk propagation across neighboring disaster zones  
3️⃣ Optimizing emergency resource allocation to maximize population rescue  
4️⃣ Benchmarking against DQN and greedy baselines with ablation validation

---

## 🔍 Methodology

### Phase 1 — Satellite Damage Severity Estimation
- Swin Transformer–UNet architecture on pre/post-disaster xView2 image pairs
- Annotation-grounded image-level severity scoring using weighted damage class aggregation
- Outputs normalized satellite severity score `S_sat ∈ [0, 1]`

### Phase 2 — Social Media Severity & Urgency Analysis
- DistilBERT encoder for semantic tweet embeddings
- Supervised classification head for social severity score `S_soc`
- Heuristic urgency layer detecting emergency keywords, exclamation density, imperative verbs, and temporal burst signals
- Event-level aggregation with confidence scoring based on tweet volume

### Phase 3 — Multi-Modal Risk Fusion
- Confidence-weighted linear fusion: `R_i = α·S_sat + β·C·S_soc + γ·C·U_soc`
- Spearman correlation ρ = 0.20 between modalities confirms complementary (non-redundant) signals
- K-Means geographic clustering produces 23 spatial zones

### Phase 4 — GCN-Based Spatial Risk Refinement
- Each disaster zone modeled as a graph node; edges via Haversine distance threshold
- Multi-layer GCN propagates risk across neighboring zones
- High-risk zone clusters amplified by 18–25%; isolated zones attenuated toward regional mean

### Phase 5 — Reinforcement Learning–Based Resource Allocation
- **PPO (Primary):** Actor-critic architecture, 800K+ timesteps, clipped surrogate objective
- **DQN (Baseline):** Temporal-difference Q-learning with experience replay
- **Greedy (Baseline):** Proximity-first, injury-severity-ranked dispatch
- Reward function balances lives saved, travel distance, resource wastage, and response delay

---

## 🧠 Model Architecture

```
Satellite Images (xView2)           Social Media Tweets (HumAID)
        ↓                                       ↓
Swin Transformer–UNet             DistilBERT Encoder
        ↓                           ↓                  ↓
  Satellite Severity         Social Severity      Heuristic Urgency
           ↓                          ↓                  ↓
              ── Confidence-Aware Multi-Modal Risk Fusion ──
                                  ↓
                    K-Means Spatial Zone Formation
                                  ↓
              Graph Convolutional Network (GCN) Risk Refinement
                                  ↓
         Population Exposure Grounding (WorldPop 1 km Grid)
                                  ↓
           PPO Reinforcement Learning Agent → Resource Allocation
                                  ↓
              ARTEMIS Real-Time Decision Support Dashboard
```

**Key components:**
- Swin Transformer–UNet for pixel-wise damage segmentation
- DistilBERT (transformer) for social severity classification
- Graph Convolutional Network for spatial risk propagation
- PPO Actor-Critic (with DQN and Greedy baselines)
- ARTEMIS simulation dashboard for operational interpretability

---

## 🧪 Model Performance

### Aggregate Disaster Response Comparison

| Model | Overall Save (%) | Injured Saved (%) | Displaced Saved (%) | Total Deaths |
|-------|-----------------|-------------------|---------------------|--------------|
| **PPO (Ours)** | **92.1** | **91.7** | **89.0** | **1,462** |
| DQN | 88.0 | 91.2 | 85.7 | 1,519 |
| Greedy | 85.8 | 92.4 | 81.1 | 1,569 |

✨ **PPO outperforms DQN by +4.1 pp and Greedy by +6.3 pp overall.**

### Zone-Level PPO Results (Summary)

| Zone | Disaster Type | Total People | Total Saved | Save Rate (%) |
|------|--------------|-------------|-------------|---------------|
| 4  | Wind  | 1,111  | 1,002  | 90.19 |
| 12 | Wind  | 10,384 | 9,518  | 91.66 |
| 14 | Wind  | 6,974  | 6,444  | 92.40 |
| 26 | Wind  | 1,465  | 1,324  | 90.37 |
| 28 | Flood | 3,782  | 3,461  | 91.51 |
| 2  | Wind  | 13,901 | 12,854 | 92.47 |
| 13 | Flood | 9,061  | 8,364  | 92.31 |
| 19 | Flood | 3,149  | 2,899  | 92.07 |
| **Total** | — | **49,827** | **45,866** | **92.1** |

### Multimodal Risk Fusion Metrics

| Correlation | Value | Interpretation |
|---|---|---|
| Satellite ↔ Social | ρ = 0.20 | Near-orthogonal — complementary signals |
| Satellite ↔ Fused Risk | ρ = 0.96 | Physical damage dominates risk ordering |
| Social ↔ Fused Risk | ρ = 0.40 | Social signal meaningfully contributes |

---

## 🖥️ ARTEMIS Dashboard

**ARTEMIS** (AI Disaster Response Tactical Emergency Management and Intelligence System) provides a real-time simulation and analytics interface powered by the trained PPO agent.

**Dashboard features:**
- Interactive operational map with zone-level damage overlays (red → green clearance)
- Live ambulance, bus, and boat routing visualization
- Real-time rescue counters: saved, injured, displaced, casualties
- Cumulative Saves Over Time graph across 96 simulation timesteps
- PPO Training Reward Curve (5M steps)
- Zone × Metric Performance Heatmap
- Post-simulation analytics: fleet utilization, bed turnover, shelter occupancy

Trained across **8 disaster zones** (5 wind: Haiti, Gulf Coast + 3 flood: Houston, TX) and **96 timesteps** covering real geographic coordinates.

---

## 🛠 Tech Stack

| Layer | Tools |
|-------|-------|
| Satellite Damage Assessment | Swin Transformer–UNet, xView2 Dataset |
| Social Media Analysis | DistilBERT, HumAID Dataset |
| Spatial Risk Modeling | Graph Convolutional Network (GCN), K-Means |
| Population Grounding | WorldPop 2020, Haversine Distance |
| Reinforcement Learning | PPO, DQN (Stable-Baselines3 / PyTorch) |
| Simulation Dashboard | ARTEMIS (Python + Visualization Stack) |
| Data Processing | NumPy, Pandas, GeoPandas, Scikit-learn |
| Deep Learning | PyTorch, Transformers (HuggingFace) |

---

## ⚙️ How to Run the Project

**1. Clone the repository**
```bash
git clone https://github.com/your-username/Disaster-Resource-Optimization.git
cd Disaster-Resource-Optimization
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Run the notebooks in order**

| Step | Notebook | Description |
|------|----------|-------------|
| 1 | `dataset_loading.ipynb` | Load and preprocess all datasets |
| 2 | `satellite_severity_computation.ipynb` | Compute satellite damage severity scores |
| 3 | `social_media_severity_computation.ipynb` | Estimate social severity and urgency |
| 4 | `fusion_of_risk_scores.ipynb` | Multi-modal risk fusion + zone formation |
| 5 | `gnn_risk_scores.ipynb` | GCN-based spatial risk refinement |
| 6 | `resource_database.ipynb` | Generate structured disaster resource database |
| 7 | `ppo_code.ipynb` | Train and evaluate PPO agent |
| 8 | `dqn_code.ipynb` | Train and evaluate DQN baseline |
| 9 | `greedy_code.ipynb` | Run greedy heuristic baseline |
| 10 | `ablation_study_code.ipynb` | Run ablation experiments |

---

## 🔬 Ablation Study

Each framework component was individually removed to measure its contribution to overall PPO performance:

| Variant | People Saved | Overall Save Rate (%) | Δ vs Full PPO |
|---------|-------------|----------------------|---------------|
| **Full PPO** | **45,866** | **92.1%** | — |
| w/o Social Media | 43,250 | 86.8% | −5.3 pp |
| w/o Satellite Images | 40,460 | 81.2% | −10.9 pp |
| w/o GCN | 43,599 | 87.5% | −4.6 pp |
| All Removed | 38,417 | 77.1% | −15.0 pp |

📝 **Key Insights:**
- Satellite imagery is the most informative component (−10.9 pp when removed)
- Social media urgency contributes critical hidden-crisis detection (−5.3 pp)
- GCN spatial propagation improves zone allocation ordering (−4.6 pp)
- All removal cases underperform even the greedy baseline (85.8%), confirming every component is essential

---

## 🔭 Future Enhancements

- Integration of real-time IoT sensor streams and radar weather data
- OpenStreetMap (OSM) dynamic infrastructure for improved simulation realism
- Extension to Graph Attention Networks and spatiotemporal GNNs
- Multi-agent RL where ambulances, rescue units, and boats operate collaboratively
- Scaling to regional and national disaster scenarios
- Deployment as an operational decision-support tool for emergency management authorities

---

## 📄 License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

---

## 📬 Authors

| Name | Institution | Contact |
|------|------------|---------|
| S Baghavathi Priya | Amrita School of Computing, Amrita Vishwa Vidyapeetham, Chennai | s_baghavathipriya@ch.amrita.edu |
| Priyanga S | Amrita School of Computing, Amrita Vishwa Vidyapeetham, Chennai | priyangaselvaperumal2294@gmail.com |
| Vishnu S | Amrita School of Computing, Amrita Vishwa Vidyapeetham, Chennai | svishnu.2k4@gmail.com |
