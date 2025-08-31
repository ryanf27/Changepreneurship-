from flask import Blueprint, request, jsonify, session
from src.models.assessment import db, User, Assessment, AssessmentResponse, EntrepreneurProfile
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import json

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/dashboard/overview', methods=['GET'])
def get_dashboard_overview():
    """Get comprehensive dashboard overview for authenticated user"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    try:
        # Get user's assessments
        assessments = Assessment.query.filter_by(user_id=user_id).all()
        
        # Calculate overall progress
        total_phases = 7  # 7-part framework
        completed_phases = len([a for a in assessments if a.completed])
        overall_progress = (completed_phases / total_phases) * 100 if total_phases > 0 else 0
        
        # Calculate total time spent (mock calculation)
        total_time = sum([a.progress_percentage * 0.6 for a in assessments])  # Rough estimate
        
        # Get current phase
        current_phase = None
        phase_order = ['self-discovery', 'idea-discovery', 'market-research', 'business-pillars', 
                      'product-concept-testing', 'business-development', 'business-prototype-testing']
        
        for phase_id in phase_order:
            assessment = next((a for a in assessments if a.phase_id == phase_id), None)
            if not assessment or not assessment.completed:
                current_phase = phase_id
                break
        
        # Get recent activity
        recent_assessments = Assessment.query.filter_by(user_id=user_id)\
            .filter(Assessment.updated_at >= datetime.utcnow() - timedelta(days=30))\
            .order_by(desc(Assessment.updated_at)).limit(5).all()
        
        # Generate insights
        insights = generate_user_insights(assessments, overall_progress)
        
        # Calculate achievements
        achievements = calculate_achievements(assessments)
        
        dashboard_data = {
            'overall_progress': round(overall_progress, 1),
            'completed_phases': completed_phases,
            'total_phases': total_phases,
            'current_phase': current_phase,
            'time_spent': round(total_time),
            'insights': insights,
            'achievements': achievements,
            'recent_activity': [
                {
                    'phase_id': a.phase_id,
                    'progress': a.progress_percentage,
                    'updated_at': a.updated_at.isoformat(),
                    'completed': a.completed
                } for a in recent_assessments
            ],
            'phase_progress': [
                {
                    'phase_id': phase_id,
                    'progress': next((a.progress_percentage for a in assessments if a.phase_id == phase_id), 0),
                    'completed': next((a.completed for a in assessments if a.phase_id == phase_id), False),
                    'last_updated': next((a.updated_at.isoformat() for a in assessments if a.phase_id == phase_id), None)
                } for phase_id in phase_order
            ]
        }
        
        return jsonify({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/dashboard/progress-history', methods=['GET'])
def get_progress_history():
    """Get historical progress data for charts"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    days = request.args.get('days', 30, type=int)
    
    try:
        # Get assessments updated in the last N days
        start_date = datetime.utcnow() - timedelta(days=days)
        assessments = Assessment.query.filter_by(user_id=user_id)\
            .filter(Assessment.updated_at >= start_date)\
            .order_by(Assessment.updated_at).all()
        
        # Group by date and calculate daily progress
        daily_progress = {}
        for assessment in assessments:
            date_key = assessment.updated_at.date().isoformat()
            if date_key not in daily_progress:
                daily_progress[date_key] = {
                    'date': date_key,
                    'total_progress': 0,
                    'phases_updated': 0,
                    'phases_completed': 0
                }
            
            daily_progress[date_key]['total_progress'] += assessment.progress_percentage
            daily_progress[date_key]['phases_updated'] += 1
            if assessment.completed:
                daily_progress[date_key]['phases_completed'] += 1
        
        # Convert to list and calculate averages
        history_data = []
        for date_data in daily_progress.values():
            avg_progress = date_data['total_progress'] / date_data['phases_updated'] if date_data['phases_updated'] > 0 else 0
            history_data.append({
                'date': date_data['date'],
                'average_progress': round(avg_progress, 1),
                'phases_updated': date_data['phases_updated'],
                'phases_completed': date_data['phases_completed']
            })
        
        return jsonify({
            'success': True,
            'data': sorted(history_data, key=lambda x: x['date'])
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/dashboard/entrepreneur-profile', methods=['GET'])
def get_entrepreneur_profile():
    """Get detailed entrepreneur profile and archetype analysis"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    try:
        # Get entrepreneur profile
        profile = EntrepreneurProfile.query.filter_by(user_id=user_id).first()
        
        # Get self-discovery assessment responses
        self_discovery = Assessment.query.filter_by(
            user_id=user_id, 
            phase_id='self-discovery'
        ).first()
        
        profile_data = {
            'archetype': profile.archetype if profile else None,
            'risk_tolerance': profile.risk_tolerance if profile else None,
            'motivation_score': profile.motivation_score if profile else None,
            'experience_level': profile.experience_level if profile else None,
            'industry_focus': profile.industry_focus if profile else None,
            'strengths': json.loads(profile.strengths) if profile and profile.strengths else [],
            'development_areas': json.loads(profile.development_areas) if profile and profile.development_areas else [],
            'assessment_completed': self_discovery.completed if self_discovery else False,
            'last_updated': profile.updated_at.isoformat() if profile else None
        }
        
        # Add archetype details
        if profile_data['archetype']:
            archetype_details = get_archetype_details(profile_data['archetype'])
            profile_data['archetype_details'] = archetype_details
        
        return jsonify({
            'success': True,
            'data': profile_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/dashboard/recommendations', methods=['GET'])
def get_personalized_recommendations():
    """Get AI-powered personalized recommendations"""
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    user_id = session['user_id']
    
    try:
        # Get user's assessment data
        assessments = Assessment.query.filter_by(user_id=user_id).all()
        profile = EntrepreneurProfile.query.filter_by(user_id=user_id).first()
        
        # Generate recommendations based on progress and profile
        recommendations = generate_recommendations(assessments, profile)
        
        return jsonify({
            'success': True,
            'data': recommendations
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_user_insights(assessments, overall_progress):
    """Generate personalized insights based on user progress"""
    insights = []
    
    completed_count = len([a for a in assessments if a.completed])
    
    if overall_progress >= 75:
        insights.append({
            'type': 'success',
            'title': 'Excellent Progress!',
            'description': 'You\'re well on your way to completing your entrepreneurial assessment.',
            'action': 'Continue with the remaining phases to complete your journey.'
        })
    elif overall_progress >= 50:
        insights.append({
            'type': 'info',
            'title': 'Great Momentum!',
            'description': 'You\'ve completed half of your entrepreneurial assessment.',
            'action': 'Keep building on your progress with the implementation phases.'
        })
    elif overall_progress >= 25:
        insights.append({
            'type': 'info',
            'title': 'Good Start!',
            'description': 'You\'ve made solid progress on your entrepreneurial journey.',
            'action': 'Continue with the next phase to build momentum.'
        })
    else:
        insights.append({
            'type': 'warning',
            'title': 'Ready to Begin?',
            'description': 'Start your entrepreneurial journey with the Self Discovery assessment.',
            'action': 'Complete the foundation phases to unlock advanced features.'
        })
    
    # Add specific insights based on completed phases
    if completed_count >= 4:
        insights.append({
            'type': 'success',
            'title': 'Foundation Complete!',
            'description': 'You\'ve completed all foundation phases. Ready for implementation!',
            'action': 'Begin testing your business concepts with real market validation.'
        })
    
    return insights

def calculate_achievements(assessments):
    """Calculate user achievements based on assessment progress"""
    achievements = []
    completed_count = len([a for a in assessments if a.completed])
    
    # Basic progress achievements
    if completed_count >= 1:
        achievements.append({
            'name': 'First Steps',
            'description': 'Completed your first assessment phase',
            'icon': '🎯',
            'earned_date': min([a.updated_at for a in assessments if a.completed]).isoformat()
        })
    
    if completed_count >= 4:
        achievements.append({
            'name': 'Foundation Builder',
            'description': 'Completed all foundation phases',
            'icon': '🏗️',
            'earned_date': max([a.updated_at for a in assessments if a.completed and a.phase_id in 
                              ['self-discovery', 'idea-discovery', 'market-research', 'business-pillars']]).isoformat()
        })
    
    if completed_count >= 7:
        achievements.append({
            'name': 'Journey Complete',
            'description': 'Completed the entire 7-part assessment',
            'icon': '🏆',
            'earned_date': max([a.updated_at for a in assessments if a.completed]).isoformat()
        })
    
    # Specific phase achievements
    phase_achievements = {
        'self-discovery': {'name': 'Self-Aware', 'description': 'Discovered your entrepreneur archetype', 'icon': '🧠'},
        'idea-discovery': {'name': 'Idea Generator', 'description': 'Identified business opportunities', 'icon': '💡'},
        'market-research': {'name': 'Market Analyst', 'description': 'Completed market research and validation', 'icon': '📊'},
        'business-pillars': {'name': 'Strategic Planner', 'description': 'Built comprehensive business plan', 'icon': '📋'},
        'product-concept-testing': {'name': 'Product Tester', 'description': 'Validated product concepts', 'icon': '🧪'},
        'business-development': {'name': 'Business Developer', 'description': 'Mastered strategic decision-making', 'icon': '🚀'},
        'business-prototype-testing': {'name': 'Prototype Master', 'description': 'Completed business model validation', 'icon': '🔬'}
    }
    
    for assessment in assessments:
        if assessment.completed and assessment.phase_id in phase_achievements:
            achievement = phase_achievements[assessment.phase_id]
            achievements.append({
                'name': achievement['name'],
                'description': achievement['description'],
                'icon': achievement['icon'],
                'earned_date': assessment.updated_at.isoformat()
            })
    
    return achievements

def get_archetype_details(archetype):
    """Get detailed information about entrepreneur archetype"""
    archetype_data = {
        'visionary-builder': {
            'name': 'Visionary Builder',
            'description': 'Focused on creating transformative solutions that change the world',
            'traits': ['Innovation-focused', 'Long-term thinking', 'High risk tolerance', 'Transformative solutions'],
            'business_focus': 'Innovation, disruption, major impact',
            'time_horizon': '10+ years',
            'examples': ['Tech startups', 'Revolutionary products', 'Social movements']
        },
        'practical-problem-solver': {
            'name': 'Practical Problem-Solver',
            'description': 'Identifies problems and creates practical solutions',
            'traits': ['Solution-oriented', 'Practical approach', 'Customer-focused', 'Immediate impact'],
            'business_focus': 'Useful products/services, customer solutions',
            'time_horizon': '3-5 years',
            'examples': ['Service businesses', 'Consulting', 'Improved traditional offerings']
        },
        'lifestyle-freedom-seeker': {
            'name': 'Lifestyle Freedom-Seeker',
            'description': 'Builds businesses that support desired lifestyle',
            'traits': ['Work-life balance', 'Personal freedom', 'Flexible approach', 'Lifestyle alignment'],
            'business_focus': 'Sustainable income, work-life balance',
            'time_horizon': 'Flexible',
            'examples': ['Online businesses', 'Freelancing', 'Location-independent work']
        }
        # Add other archetypes as needed
    }
    
    return archetype_data.get(archetype, {})

def generate_recommendations(assessments, profile):
    """Generate personalized recommendations based on user data"""
    recommendations = []
    completed_phases = [a.phase_id for a in assessments if a.completed]
    
    # Phase-specific recommendations
    if 'self-discovery' not in completed_phases:
        recommendations.append({
            'type': 'next_step',
            'title': 'Start with Self-Discovery',
            'description': 'Begin your journey by understanding your entrepreneurial personality',
            'priority': 'high',
            'estimated_time': '60-90 minutes'
        })
    elif 'idea-discovery' not in completed_phases:
        recommendations.append({
            'type': 'next_step',
            'title': 'Explore Business Ideas',
            'description': 'Transform your insights into concrete business opportunities',
            'priority': 'high',
            'estimated_time': '90-120 minutes'
        })
    
    # Profile-based recommendations
    if profile and profile.archetype:
        archetype_recommendations = get_archetype_recommendations(profile.archetype)
        recommendations.extend(archetype_recommendations)
    
    # Progress-based recommendations
    if len(completed_phases) >= 4:
        recommendations.append({
            'type': 'milestone',
            'title': 'Ready for Implementation',
            'description': 'You\'ve completed the foundation. Time to test your concepts!',
            'priority': 'medium',
            'estimated_time': '2-4 weeks'
        })
    
    return recommendations

def get_archetype_recommendations(archetype):
    """Get recommendations specific to entrepreneur archetype"""
    recommendations_map = {
        'visionary-builder': [
            {
                'type': 'resource',
                'title': 'Innovation Resources',
                'description': 'Explore cutting-edge technologies and disruptive business models',
                'priority': 'medium'
            }
        ],
        'practical-problem-solver': [
            {
                'type': 'resource',
                'title': 'Customer Research Tools',
                'description': 'Focus on understanding customer pain points and needs',
                'priority': 'medium'
            }
        ]
        # Add more archetype-specific recommendations
    }
    
    return recommendations_map.get(archetype, [])

