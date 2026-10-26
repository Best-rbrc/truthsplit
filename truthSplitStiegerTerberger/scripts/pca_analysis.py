#!/usr/bin/env python3
"""
PCA Visualization of Worldviews

Applies Principal Component Analysis to the worldview factor scores
and creates visualizations showing how different ideological profiles
cluster in the reduced dimensional space.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from pathlib import Path

# Set style for better plots
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

def load_factor_scores():
    """Load the worldview factor scores from CSV"""
    csv_path = Path(__file__).parent.parent / "vectors" / "factor_scores.csv"
    
    if not csv_path.exists():
        raise FileNotFoundError(f"Factor scores CSV not found at: {csv_path}")
    
    df = pd.read_csv(csv_path)
    return df

def clean_worldview_names(df):
    """Convert worldview IDs to display names"""
    name_mapping = {
        'populist_nationalist': 'Populist-MAGA',
        'libertarian': 'Libertarian',
        'religious_conservative': 'Religious Conservative',
        'eco_justice': 'Eco-Justice'
    }
    
    df['display_name'] = df['worldview_id'].map(name_mapping)
    return df

def perform_pca_analysis(df):
    """Perform PCA on the factor scores"""
    # Separate features from worldview identifiers
    feature_cols = [col for col in df.columns if col not in ['worldview_id', 'display_name']]
    X = df[feature_cols].values
    
    # Standardize the features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Apply PCA
    pca = PCA()
    X_pca = pca.fit_transform(X_scaled)
    
    # Create results dataframe
    pca_df = pd.DataFrame(X_pca, columns=[f'PC{i+1}' for i in range(X_pca.shape[1])])
    pca_df['worldview_id'] = df['worldview_id']
    pca_df['display_name'] = df['display_name']
    
    return pca_df, pca, scaler, feature_cols

def plot_pca_2d(pca_df, pca, explained_variance_ratio):
    """Create 2D PCA plot"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # Plot 1: PCA scatter plot
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
    
    for i, (worldview, name) in enumerate(zip(pca_df['worldview_id'], pca_df['display_name'])):
        ax1.scatter(pca_df.iloc[i]['PC1'], pca_df.iloc[i]['PC2'], 
                   c=colors[i], s=200, alpha=0.8, label=name, edgecolor='black', linewidth=2)
    
    ax1.set_xlabel(f'PC1 ({explained_variance_ratio[0]:.1%} variance)')
    ax1.set_ylabel(f'PC2 ({explained_variance_ratio[1]:.1%} variance)')
    ax1.set_title('Worldviews in PCA Space', fontsize=14, fontweight='bold')
    ax1.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    ax1.grid(True, alpha=0.3)
    
    # Add annotations
    for i, name in enumerate(pca_df['display_name']):
        ax1.annotate(name, (pca_df.iloc[i]['PC1'], pca_df.iloc[i]['PC2']), 
                    xytext=(10, 10), textcoords='offset points', 
                    fontsize=10, fontweight='bold')
    
    # Plot 2: Explained variance
    cumsum_variance = np.cumsum(explained_variance_ratio)
    ax2.bar(range(1, len(explained_variance_ratio) + 1), explained_variance_ratio, 
           alpha=0.7, color='skyblue', edgecolor='black')
    ax2.plot(range(1, len(explained_variance_ratio) + 1), cumsum_variance, 
            'ro-', linewidth=2, markersize=8)
    
    ax2.set_xlabel('Principal Component')
    ax2.set_ylabel('Explained Variance Ratio')
    ax2.set_title('PCA Explained Variance', fontsize=14, fontweight='bold')
    ax2.grid(True, alpha=0.3)
    
    # Add percentage labels
    for i, (var, cum) in enumerate(zip(explained_variance_ratio, cumsum_variance)):
        ax2.text(i + 1, var + 0.01, f'{var:.1%}', ha='center', fontweight='bold')
        ax2.text(i + 1, cum + 0.02, f'{cum:.1%}', ha='center', color='red', fontweight='bold')
    
    plt.tight_layout()
    return fig

def plot_factor_loadings(pca, feature_cols):
    """Plot factor loadings to understand what PC1 and PC2 represent"""
    fig, ax = plt.subplots(figsize=(12, 8))
    
    # Get loadings for first two components
    loadings = pca.components_[:2].T
    
    # Create a scatter plot of loadings
    ax.scatter(loadings[:, 0], loadings[:, 1], alpha=0.7, s=100, color='navy')
    
    # Add feature labels
    for i, feature in enumerate(feature_cols):
        # Clean up feature names for display
        display_name = feature.replace('_', ' ').title()
        ax.annotate(display_name, (loadings[i, 0], loadings[i, 1]), 
                   xytext=(5, 5), textcoords='offset points', 
                   fontsize=10, ha='left')
    
    # Add reference lines
    ax.axhline(y=0, color='k', linestyle='--', alpha=0.3)
    ax.axvline(x=0, color='k', linestyle='--', alpha=0.3)
    
    ax.set_xlabel(f'PC1 Loading')
    ax.set_ylabel(f'PC2 Loading')
    ax.set_title('Factor Loadings on Principal Components', fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    return fig

def create_heatmap(df, feature_cols):
    """Create a heatmap of the original factor scores"""
    fig, ax = plt.subplots(figsize=(14, 6))
    
    # Prepare data for heatmap
    heatmap_data = df.set_index('display_name')[feature_cols]
    
    # Clean up column names
    clean_cols = [col.replace('_', ' ').title() for col in feature_cols]
    heatmap_data.columns = clean_cols
    
    # Create heatmap
    sns.heatmap(heatmap_data, annot=True, cmap='RdYlBu_r', 
                center=0.5, fmt='.2f', cbar_kws={'label': 'Factor Score'},
                linewidths=0.5, ax=ax)
    
    ax.set_title('Worldview Factor Scores Heatmap', fontsize=14, fontweight='bold')
    ax.set_ylabel('Worldview')
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()
    return fig

def calculate_pairwise_distances(pca_df):
    """Calculate distances between worldviews in PCA space"""
    from scipy.spatial.distance import pdist, squareform
    
    # Use first two principal components for distance calculation
    coords = pca_df[['PC1', 'PC2']].values
    distances = pdist(coords, metric='euclidean')
    distance_matrix = squareform(distances)
    
    # Create DataFrame
    names = pca_df['display_name'].values
    distance_df = pd.DataFrame(distance_matrix, 
                              index=names, 
                              columns=names)
    
    return distance_df

def main():
    """Main function to generate all PCA visualizations"""
    print("🔬 Starting PCA Analysis of Worldviews...")
    
    # Load and prepare data
    df = load_factor_scores()
    df = clean_worldview_names(df)
    print(f"✅ Loaded {len(df)} worldviews with {len(df.columns)-2} factors")
    
    # Perform PCA
    pca_df, pca, scaler, feature_cols = perform_pca_analysis(df)
    explained_variance = pca.explained_variance_ratio_
    
    print(f"📊 PCA Results:")
    print(f"   PC1 explains {explained_variance[0]:.1%} of variance")
    print(f"   PC2 explains {explained_variance[1]:.1%} of variance")
    print(f"   Total variance captured: {sum(explained_variance[:2]):.1%}")
    
    # Create visualizations
    print("📈 Creating visualizations...")
    
    # 1. Main PCA plot
    fig1 = plot_pca_2d(pca_df, pca, explained_variance)
    fig1.suptitle('Worldview Clustering in Principal Component Space', fontsize=16, fontweight='bold')
    plt.show()
    
    # 2. Factor loadings
    fig2 = plot_factor_loadings(pca, feature_cols)
    plt.show()
    
    # 3. Original data heatmap
    fig3 = create_heatmap(df, feature_cols)
    plt.show()
    
    # 4. Distance analysis
    distances = calculate_pairwise_distances(pca_df)
    print("\n🔍 Pairwise Distances in PCA Space:")
    print(distances.round(2))
    
    # Find most and least similar pairs
    mask = np.triu(np.ones_like(distances, dtype=bool), k=1)
    distance_values = distances.where(mask).stack()
    
    most_similar = distance_values.idxmin()
    least_similar = distance_values.idxmax()
    
    print(f"\n📍 Most similar worldviews: {most_similar[0]} ↔ {most_similar[1]} (distance: {distance_values.min():.2f})")
    print(f"📍 Least similar worldviews: {least_similar[0]} ↔ {least_similar[1]} (distance: {distance_values.max():.2f})")
    
    # Print component interpretation
    print(f"\n🎯 Component Interpretation:")
    print("PC1 (horizontal axis):")
    pc1_loadings = pd.Series(pca.components_[0], index=feature_cols).sort_values(key=abs, ascending=False)
    for factor, loading in pc1_loadings.head(3).items():
        direction = "→" if loading > 0 else "←"
        print(f"   {direction} {factor.replace('_', ' ').title()}: {loading:.3f}")
    
    print("\nPC2 (vertical axis):")
    pc2_loadings = pd.Series(pca.components_[1], index=feature_cols).sort_values(key=abs, ascending=False)
    for factor, loading in pc2_loadings.head(3).items():
        direction = "↑" if loading > 0 else "↓"
        print(f"   {direction} {factor.replace('_', ' ').title()}: {loading:.3f}")
    
    print("\n✅ PCA analysis complete!")
    return pca_df, pca, distances

if __name__ == "__main__":
    results = main()