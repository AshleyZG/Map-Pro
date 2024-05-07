from sklearn.cluster import KMeans
import numpy as np
from sklearn.manifold import TSNE
from itertools import chain
from joblib import load

def get_code_position(n_clusters, df):

    new_df = df.copy()

    matrix = np.vstack(df.embeddings.values)

    kmeans_loaded = load('../data/kmeans_model_solution.joblib')
    labels = kmeans_loaded.predict(matrix)

    # kmeans = KMeans(n_clusters=n_clusters, init="k-means++", random_state=42)
    # kmeans.fit(matrix)
    # labels = kmeans.labels_

    new_df["cluster"] = labels

    if (n_clusters==4):
        new_df['correctedCluster'] = new_df['cluster'].apply(lambda x:  1 if x==3 else 0)
    else:
        new_df['correctedCluster'] = new_df['cluster']
        
    tsne = TSNE(n_components=2, perplexity=15, random_state=42, init="random", learning_rate=200)
    vis_dims2 = tsne.fit_transform(matrix)

    x = [x for x, y in vis_dims2]
    y = [y for x, y in vis_dims2]

    new_df['x'] = x
    new_df['y'] = y

    return new_df



def get_seg_labels(n_clusters, df):
    new_df = df.copy()

    seg_embeddings = list(chain.from_iterable(new_df.segEmbeddings))

    matrix = matrix = np.vstack(seg_embeddings)

    # kmeans = KMeans(n_clusters=n_clusters, init="k-means++", random_state=42)
    # kmeans.fit(matrix)
    # labels = kmeans.labels_.tolist()

    kmeans_loaded = load('../data/kmeans_model.joblib')
    labels = kmeans_loaded.predict(matrix).tolist()

    nested_labels = []
    current_idx = 0
    for _, row in new_df.iterrows():
        nested_labels.append(labels[current_idx: current_idx+len(row.segments)])
        current_idx += len(row.segments)

    new_df['segLabels'] = nested_labels
    return new_df