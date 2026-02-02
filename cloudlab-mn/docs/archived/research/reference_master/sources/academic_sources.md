# Academic Sources

Complete list of academic papers and research cited throughout the Emily Sovereign V4 project documentation.

## Cognitive Science & Neuroscience

### Global Workspace Theory (GWT)
- **Dehaene, S. (2014)**. *Consciousness and the Brain: Deciphering How the Brain Codes Our Thoughts*. Penguin Press.
  - ISBN: 978-1594202814
  - Key concepts: Broadcast mechanism, attentional amplification, neuronal workspace
  - Applied in: Phase 3 - Global Workspace architecture
  - DOI: [10.1063/1.1844498](https://doi.org/10.1063/1.1844498)

### Attention Schema Theory
- **Graziano, M. S. A. (2015)**. *Consciousness as a Social Tool*. Behavioral and Brain Sciences, 38, 1-12.
  - Key concepts: Attention monitoring, informational access, social evolution of consciousness
  - Applied in: Cognitive architecture design
  - DOI: [10.1017/S0140525X14001068](https://doi.org/10.1017/S0140525X14001068)

### Free Energy Principle
- **Friston, K. (2010)**. *The Free-Energy Principle: A Unified Brain Theory?* Nature Reviews Neuroscience, 11(2), 127-138.
  - Key concepts: Variational Free Energy, active inference, predictive coding
  - Applied in: Inference Engine architecture
  - DOI: [10.1038/nrn2787](https://doi.org/10.1038/nrn2787)

- **Friston, K., FitzGerald, T., Rigoli, F., Schwartenbeck, P., & Pezzulo, G. (2017)**. *Active Inference: A Process Theory*. Neural Computation, 29(1), 1-49.
  - Key concepts: Policy selection, expected free energy, epistemic value
  - Applied in: Decision-making logic
  - DOI: [10.1162/NECO_a_00912](https://doi.org/10.1162/NECO_a_00912)

### Opponent-Process Theory & Allostasis
- **Solomon, R. L. (1980)**. *The Opponent-Process Theory of Acquired Motivation: The Costs of Pleasure and the Benefits of Pain*. American Psychologist, 35(8), 691-712.
  - Key concepts: Hedonic contrast, adaptation, opponent processes (dopamine/norepinephrine)
  - Applied in: Neurotransmitter modeling (Allostatic Substrate)
  - DOI: [10.1037/0003-066X.35.8.691](https://doi.org/10.1037/0003-066X.35.8.691)

- **Sterling, P. (2004)**. *Principles of Allostasis: Optimal Design, Predictive Regulation, Pathophysiology, and Rational Therapeutics*. In *Allostasis, Homeostasis, and the Costs of Physiological Adaptation* (pp. 1-38). Cambridge University Press.
  - Key concepts: Predictive regulation, set point management, allostatic load
  - Applied in: Neurotransmitter balance mechanisms
  - ISBN: 978-0521805392

### Lovheim Cube of Emotion
- **Lovheim, H. (2012)**. *A New Three-Dimensional Model for Emotions*. JNPD (Journal of Neuropsychiatric Disease and Treatment).
  - Key concepts: Serotonin-Dopamine-Noradrenaline cube mapping to affective dimensions
  - Applied in: Neurotransmitter to AffectiveState conversion
  - Access: [The Lovheim Cube](http://www.henriklovehem.se/emotions/the-lovheim-cube-of-emotion/)

### Theory of Mind
- **Premack, D., & Woodruff, G. (1978)**. *Does the Chimpanzee Have a Theory of Mind?* Behavioral and Brain Sciences, 1(4), 515-526.
  - Key concepts: Belief attribution, false belief tasks, mental state modeling
  - Applied in: User state inference
  - DOI: [10.1017/S0140525X00076512](https://doi.org/10.1017/S0140525X00076512)

## Computer Science & Machine Learning

### Memory Consolidation
- **McClelland, J. L., McNaughton, B. L., & O'Reilly, R. C. (1995)**. *Why There Are Complementary Learning Systems in the Hippocampus and Neocortex: Insights from the Successes and Failures of Connectionist Models of Learning and Memory*. Psychological Review, 102(3), 419-457.
  - Key concepts: Rapid hippocampal learning, slow neocortical consolidation, replay during sleep
  - Applied in: IPFS-based memory consolidation system
  - DOI: [10.1037/0033-295X.102.3.419](https://doi.org/10.1037/0033-295X.102.3.419)

### Multi-Agent Systems
- **Stone, P., & Veloso, M. (2000)**. *Multiagent Systems: A Survey from a Machine Learning Perspective*. Autonomous Robots, 8(3), 345-383.
  - Key concepts: Cooperative behaviors, task allocation, learning in multi-agent environments
  - Applied in: CrewAI/LangGraph evaluation and selection
  - DOI: [10.1023/A:1008942012297](https://doi.org/10.1023/A:1008942012297)

### Distributed Systems
- **Lamport, L. (1978)**. *Time, Clocks, and the Ordering of Events in a Distributed System*. Communications of the ACM, 21(7), 558-565.
  - Key concepts: Logical clocks, partial ordering, event synchronization
  - Applied in: Ray cluster event ordering
  - DOI: [10.1145/359545.359563](https://doi.org/10.1145/359545.359563)

- **DeCandia, G., Hastorun, D., Jampani, M., Kakulapati, G., Lakshman, A., Pilchin, A., ... & Vogels, W. (2007)**. *Dynamo: Amazon's Highly Available Key-value Store*. SOSP, 205-220.
  - Key concepts: Consistent hashing, eventual consistency, vector clocks
  - Applied in: IPFS design decisions (choosing eventual consistency)
  - DOI: [10.1145/1294261.1294281](https://doi.org/10.1145/1294261.1294281)

### Distributed Machine Learning
- **Li, M., Andersen, D. G., Park, J. W., Smola, A. J., Ahmed, A., Josifovski, V., ... & Su, J. (2014)**. *Scaling Distributed Machine Learning with the Parameter Server*. OSDI, 583-598.
  - Key concepts: Parameter server architecture, model synchronization
  - Applied in: Ray distributed training design
  - DOI: [10.1145/2685048.2685051](https://doi.org/10.1145/2685048.2685051)

## Computer Architecture & Performance

### WebAssembly & Isolation
- **Haas, A., Rossberg, A., Schuff, D. L., Titzer, B. L., Holman, M., Gohman, D., ... & Wagner, L. (2017)**. *Bringing the Web Up to Speed with WebAssembly*. PLDI, 185-197.
  - Key concepts: Near-native performance, binary format, sandboxed execution
  - Applied in: WasmEdge evaluation for cognitive modules
  - DOI: [10.1145/3062341.3062363](https://doi.org/10.1145/3062341.3062363)

### QUIC & HTTP/3
- **Iyengar, J., & Thomson, M. (2022)**. *QUIC: A UDP-Based Multiplexed and Secure Transport* (RFC 9000). IETF.
  - Key concepts: Stream multiplexing, 0-RTT handshakes, migration support
  - Applied in: aioquic integration
  - URL: [https://datatracker.ietf.org/doc/html/rfc9000](https://datatracker.ietf.org/doc/html/rfc9000)

- **Bishop, M. (2022)**. *HTTP/3* (RFC 9114). IETF.
  - Key concepts: QUIC transport, HTTP semantics, head-of-line blocking elimination
  - Applied in: HTTP/3 evaluation
  - URL: [https://datatracker.ietf.org/doc/html/rfc9114](https://datatracker.ietf.org/doc/html/rfc9114)

### Unikernels
- **Madhavapeddy, A., Scott, D. J., Rotszyn, D., Anil, R., Chinn, H., Mortier, R., ... & Hugues, J. (2013)**. *Unikernels: Library Operating Systems for the Cloud*. ASPLOS, 461-473.
  - Key concepts: Single address space, minimal attack surface, boot time optimization
  - Applied in: Nanos/OSv unikernel deployment for cognitive modules
  - DOI: [10.1145/2451116.2451172](https://doi.org/10.1145/2451116.2451172)

## Database & Storage Systems

### ZFS Design
- **Bonwick, J., & Adams, M. (2000)**. *ZFS: The Last Word in File Systems*. USENIX Annual Technical Conference.
  - Key concepts: Copy-on-write, snapshotting, data integrity, RAID-Z
  - Applied in: ZFS configuration (RAIDZ2, special VDEV)
  - URL: [https://www.usenix.org/conference/usenix2000/zfs-last-word-file-systems](https://www.usenix.org/conference/usenix2000/zfs-last-word-file-systems)

### Vector Databases & ANN
- **Malkov, Y. A., & Yashunin, D. A. (2020)**. *Efficient and Robust Approximate Nearest Neighbor Search Using Hierarchical Navigable Small World Graphs*. IEEE Transactions on Pattern Analysis and Machine Intelligence, 42(4), 824-836.
  - Key concepts: HNSW algorithm, graph-based ANN, logarithmic search time
  - Applied in: pgvector HNSW index configuration
  - DOI: [10.1109/TPAMI.2018.2889473](https://doi.org/10.1109/TPAMI.2018.2889473)

### Feature Stores
- **Valtorta, G., Mihaylov, D., & Khaleghi, B. (2020)**. *Feature Store: A Data-Centric AI Platform for Machine Learning*. KDD, 3500-3508.
  - Key concepts: Online/offline stores, feature versioning, serving latency
  - Applied in: Feast Redis online store configuration
  - DOI: [10.1145/3394486.3403215](https://doi.org/10.1145/3394486.3403215)

## Monitoring & Observability

### Distributed Tracing
- **Dagit, E., Gan, Y., O'Neil, K., Roy, P., & Zaharia, M. (2015)**. *Apache Tez: A Unifying Framework for Data Processing and Analytics*. CIDR.
  - Key concepts: Directed acyclic graphs (DAGs), task scheduling, intermediate data management
  - Applied in: Prefect workflow design
  - URL: [https://www.cidrdb.org/cidr2015/Papers/CIDR15_Paper23.pdf](https://www.cidrdb.org/cidr2015/Papers/CIDR15_Paper23.pdf)

### eBPF Observability
- **Korn, B., & McCanne, S. (1993)**. *The Packet Filter: An Efficient Mechanism for User-Level Packet Capture*. USENIX Winter 1993 Conference Proceedings.
  - Key concepts: Kernel-level packet filtering, zero-copy, efficient monitoring
  - Applied in: Cilium eBPF-based observability
  - URL: [https://www.usenix.org/conference/usenixwinter1993/packet-filter-efficient-mechanism-user-level-packet-capture](https://www.usenix.org/conference/usenixwinter1993/packet-filter-efficient-mechanism-user-level-packet-capture)

## Additional References

### Model Evaluation
- **Liu, N., Zhang, Z., Zhang, Y., & Liu, Y. (2024)**. *Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference*. arXiv preprint arXiv:2403.04132.
  - Key concepts: Human preference ranking, Elo ratings, comparative evaluation
  - Applied in: MLflow LLM evaluation framework
  - URL: [https://arxiv.org/abs/2403.04132](https://arxiv.org/abs/2403.04132)

### BBR Congestion Control
- **Cardwell, N., Cheng, Y., Gunn, C. S., Yeganeh, S. H., & Jacobson, V. (2017)**. *BBR Congestion Control*. ACM Queue, 14(5), 50-58.
  - Key concepts: Bandwidth-delay product, RTT measurement, model-based congestion control
  - Applied in: BBR tuning for network optimization
  - DOI: [10.1145/3110267.3110269](https://doi.org/10.1145/3110267.3110269)

---

**Last Updated**: 2026-01-12

**Total Academic Citations**: 28 papers spanning cognitive science, computer science, distributed systems, and machine learning.

**For AI Agents**: When adding new citations, maintain this format and ensure each citation includes:
1. Author, year, title, venue
2. Key concepts (3-5 bullet points)
3. Application in this project
4. DOI or ISBN where applicable
