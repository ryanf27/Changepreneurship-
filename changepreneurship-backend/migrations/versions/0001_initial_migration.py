"""Initial database schema

Revision ID: 0001_initial
Revises: 
Create Date: 2024-01-01 00:00:00

"""
from alembic import op
import sqlalchemy as sa


revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=80), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=128), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username')
    )

    op.create_table(
        'assessment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('phase_id', sa.String(length=50), nullable=False),
        sa.Column('phase_name', sa.String(length=100), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('is_completed', sa.Boolean(), nullable=True),
        sa.Column('progress_percentage', sa.Float(), nullable=True),
        sa.Column('assessment_data', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'assessment_response',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.String(length=100), nullable=False),
        sa.Column('question_id', sa.String(length=100), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('response_type', sa.String(length=50), nullable=False),
        sa.Column('response_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessment.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'entrepreneur_profile',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('entrepreneur_archetype', sa.String(length=100), nullable=True),
        sa.Column('core_motivation', sa.String(length=200), nullable=True),
        sa.Column('risk_tolerance', sa.Float(), nullable=True),
        sa.Column('confidence_level', sa.Float(), nullable=True),
        sa.Column('primary_opportunity', sa.Text(), nullable=True),
        sa.Column('opportunity_score', sa.Float(), nullable=True),
        sa.Column('skills_assessment', sa.Text(), nullable=True),
        sa.Column('market_analysis', sa.Text(), nullable=True),
        sa.Column('competitive_analysis', sa.Text(), nullable=True),
        sa.Column('target_customers', sa.Text(), nullable=True),
        sa.Column('business_model', sa.Text(), nullable=True),
        sa.Column('financial_projections', sa.Text(), nullable=True),
        sa.Column('go_to_market_strategy', sa.Text(), nullable=True),
        sa.Column('product_concept_results', sa.Text(), nullable=True),
        sa.Column('business_development_plan', sa.Text(), nullable=True),
        sa.Column('prototype_testing_results', sa.Text(), nullable=True),
        sa.Column('success_probability', sa.Float(), nullable=True),
        sa.Column('ai_recommendations', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    op.create_table(
        'user_session',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('session_token', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_token')
    )


def downgrade():
    op.drop_table('user_session')
    op.drop_table('entrepreneur_profile')
    op.drop_table('assessment_response')
    op.drop_table('assessment')
    op.drop_table('user')

